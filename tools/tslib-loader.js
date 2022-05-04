/* eslint-disable @typescript-eslint/no-var-requires -- webpack can't load ES modules. */
const path = require("path");
const ts = require("typescript");

/**
 * @this {import("webpack").LoaderContext<{}>}
 * @param {string} request
 */
exports.pitch = function pitch(request) {
    request = request.replace("tslib:", "");
    const program = ts.createProgram(["node_modules/typescript/lib/lib."+request+".d.ts"], {typeRoots: []});
    const diags = ts.getPreEmitDiagnostics(program);
    if (diags.length > 0) {
        throw new Error("parsing returned diagnostics (did you specify a non-existent library?)");
    }
    const printer = ts.createPrinter();
    let output = "";
    for (const sf of program.getSourceFiles()) {
        // TS returns paths with / separators, even on Windows. Webpack does not like this.
        this.addDependency(path.resolve(sf.fileName));
        // Suppress *all* comments (even licenses) and <reference> tags.
        ts.setEmitFlags(sf, ts.EmitFlags.NoComments|ts.EmitFlags.NoNestedComments);
        sf.isDeclarationFile = false;
        output += printer.printFile(sf);
    }
    return output;
}
