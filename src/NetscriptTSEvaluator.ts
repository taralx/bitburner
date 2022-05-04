import tslib from "tslib:es2019.full";
import ts from "typescript";

import { RamCostConstants, RamCosts } from "./Netscript/RamCostGenerator";
import { WorkerScript } from "./Netscript/WorkerScript";
import { IPlayer } from "./PersonObjects/IPlayer";
import { RamCalculation, RamUsageEntry } from "./Script/RamCalculationTypes";
import { Script } from "./Script/Script";
import { nsLib } from "./ScriptEditor/ui/Editor";

function canonical(filename: string): string {
    if (!filename.startsWith("/")) return "/" + filename;
    return filename;
}

function makeScriptMap(scriptName: string, code: string, scripts: Script[]): Map<string, string> {
    const scriptMap: Map<string, string> = new Map();
    for (const script of scripts) {
        scriptMap.set(script.filename, script.code);
    }
    scriptMap.set(scriptName, code);
    return scriptMap;
}

class VirtualCompilerHost implements ts.CompilerHost {
    constructor(readonly scripts: Map<string, string>) { }

    getCurrentDirectory(): string {
        return "/";
    }
    getCanonicalFileName(filename: string): string {
        return canonical(filename);
    }
    resolveModuleNames(moduleNames: string[]): (ts.ResolvedModuleFull | undefined)[] {
        return moduleNames.map(name => {
            name = canonical(name);
            if (this.scripts.has(name) && !name.endsWith(".script")) {
                return {
                    resolvedFileName: name,
                    extension: name.endsWith(".ts") ? ts.Extension.Ts : ts.Extension.Mjs,
                };
            }
            return undefined;
        });
    }
    getDefaultLibFileName(): string {
        return "lib:lib.d.ts";
    }
    fileExists(filename: string): boolean {
        // return this.readFile(filename) == null;
        if (filename.endsWith("/package.json")) return false;
        if (filename === "lib:///netscript/index.d.ts") return true;
        throw new Error(filename);
    }
    readFile(filename: string): string | undefined {
        switch (filename) {
            case "lib:lib.d.ts":
                return tslib;
            case "lib:///netscript/index.d.ts":
                return nsLib;
            default:
                return this.scripts.get(filename);
        }
    }
    getSourceFile(filename: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile | undefined {
        const code = this.readFile(filename);
        if (code == null) {
            onError?.("script not found");
            return undefined;
        }
        const sf = ts.createSourceFile(filename, code, languageVersion);
        if (!filename.endsWith("ts") && !ts.isExternalModule(sf)) {
            // Don't expose non-ES modules (see moduleDetection below).
            onError?.("not a module");
            return undefined;
        }
        sf.moduleName = filename;
        return sf;
    }
    useCaseSensitiveFileNames(): boolean {
        return true;
    }
    getNewLine(): string {
        return "\n";
    }
    writeFile(): void {
        throw new Error("Method not implemented.");
    }
}

function createProgram(host: VirtualCompilerHost, root: string): ts.Program {
    return ts.createProgram({
        host: host,
        rootNames: [root],
        options: {
            allowJs: true,
            inlineSourceMap: true,
            module: ts.ModuleKind.AMD,  // TODO: write our own module transformer
            // moduleDetection: ts.ModuleDetectionKind.Force, -- requires ts v4.7
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            noEmitOnError: true,
            outFile: "o",
            removeComments: true,
            strict: true,
            suppressOutputPathCheck: true,
            target: ts.ScriptTarget.ES2019,
            typeRoots: ["lib:///"],
            types: ["netscript"],
        },
    });
}

interface RamCostEntry extends Pick<RamUsageEntry, "type"> {
    prefix?: string;
    cost: number | ((player: IPlayer) => number);
}

type RamCostMap = Map<string, RamCostEntry>;
let _ramCostMap: RamCostMap | null = null;
function ramCostMap(): RamCostMap {
    if (_ramCostMap != null) return _ramCostMap;
    // Flatten RamCosts into a Map.
    _ramCostMap = new Map;
    for (const [k, v] of Object.entries(RamCosts)) {
        if (typeof v === "object") {
            for (const [kk, vv] of Object.entries(v)) {
                _ramCostMap.set(kk, { type: "fn", prefix: k + ".", cost: vv });
            }
        } else {
            _ramCostMap.set(k, { type: "fn", cost: v });
        }
    }
    _ramCostMap.set("hacknet", { type: "ns", cost: RamCostConstants.ScriptHacknetNodesRamCost });
    _ramCostMap.set("document", { type: "dom", cost: RamCostConstants.ScriptDomRamCost });
    _ramCostMap.set("window", { type: "dom", cost: RamCostConstants.ScriptDomRamCost });
    _ramCostMap.set("corporation", { type: "ns", cost: RamCostConstants.ScriptCorporationRamCost });
    return _ramCostMap;
}

export function ramCost(player: IPlayer, scriptName: string, code: string, scripts: Script[]): RamCalculation {
    const scriptMap = makeScriptMap(scriptName, code, scripts);
    const host = new VirtualCompilerHost(scriptMap);
    const program = createProgram(host, scriptName);

    const costs = ramCostMap();
    const detail: Map<string, RamCostEntry> = new Map();
    detail.set("baseCost", { type: "misc", cost: RamCostConstants.ScriptBaseRamCost });
    for (const sf of program.getSourceFiles()) {
        if (sf.isDeclarationFile) continue;
        sf.forEachChild(function visit(node): void {
            if (!ts.isIdentifier(node)) return node.forEachChild(visit);
            const cost = costs.get(node.text);
            if (cost && !detail.has(node.text)) {
                detail.set(node.text, cost);
            }
        });
    }

    const entries = Array.from(detail, ([identifier, entry]) => ({
        type: entry.type,
        name: (entry.prefix || "") + identifier,
        cost: typeof entry.cost === "function" ? entry.cost(player) : entry.cost,
    }));
    return {
        cost: entries.reduce((sum, entry) => sum + entry.cost, 0),
        entries: entries,
    };
}

export class CompileError extends Error { }

export async function execute(workerScript: WorkerScript): Promise<void> {
    const root = workerScript.name;
    const scriptMap = makeScriptMap(root, workerScript.code, workerScript.getServer().scripts);
    const host = new VirtualCompilerHost(scriptMap);
    const program = createProgram(host, root);

    let output: string | null = null;
    const result = program.emit(undefined, (_, d) => output = d);
    const diags = result.diagnostics;
    if (diags.length > 0) {
        let msg = ts.formatDiagnostics(diags.slice(0, 4), host);
        if (diags.length > 4) msg += "\n[additional errors omitted]";
        throw new CompileError(msg);
    }
    if (output == null) {
        throw new CompileError("No compilation output");
    }

    const modules: Map<string, Record<string, unknown>> = new Map();
    function require(name: string, resolve: (module: unknown) => void, reject: (error: unknown) => void): void {
        const module = modules.get(name);
        if (module != null) resolve(module);
        // TODO: handle dynamic imports.
        else reject(new TypeError("Failed to fetch dynamically imported module: " + name));
    }
    function define(name: string, deps: string[], factory: (...args: unknown[]) => void): void {
        const exports = {};
        // TODO: forbid "export = " statements.
        factory(...deps.map(dep => {
            if (dep === "require") return require;
            if (dep === "exports") return exports;
            const module = modules.get(dep);
            if (module != null) return module;
            // TODO: handle out of order declarations.
            throw new TypeError("Unable to resolve static dependency: " + dep);
        }));
        modules.set(name, exports);
    }
    console.log(output);
    // eslint-disable-next-line no-new-func
    new Function("define", output)(define);
    const main = modules.get(root)?.main;
    if (main == null || typeof main !== "function") {
        throw new CompileError("No main function");
    }
    // Start it in a microtask so it doesn't race with the "started" message.
    return Promise.resolve().then(() => main.call(null, workerScript.env.vars));
}
