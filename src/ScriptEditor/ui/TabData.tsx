import * as monaco from "monaco-editor";
import { useEffect, useState } from "react";
import { Model, ViewState } from "./Types";

export class TabData {
    readonly model: Model;
    readonly dirty: boolean;
    viewState: ViewState | null;

    constructor(uri: monaco.Uri, code?: string) {
        let language = "javascript";
        let defaultCode = "";
        let defaultCursor: monaco.IPosition = { column: 1, lineNumber: 1 };
        if (uri.path.endsWith(".txt")) {
            language = "plaintext";
        } else if (uri.path.endsWith(".js") || uri.path.endsWith(".ns")) {
            defaultCode = "/** @param {NS} ns */\nexport async function main(ns) {\n    \n}";
            defaultCursor = { column: 5, lineNumber: 3 };
        } else if (uri.path.endsWith(".ts")) {
            language = "typescript";
            defaultCode = "export async function main(ns: NS): Promise<void> {\n    \n}";
            defaultCursor = { column: 5, lineNumber: 2 };
        }
        this.model = monaco.editor.createModel(code ?? defaultCode, language, uri);
        this.dirty = false;
        this.viewState = null;

        if (code == null) {
            this.dirty = true;
            this.viewState = {
                contributionsState: {},
                cursorState: [{
                    inSelectionMode: false,
                    position: defaultCursor,
                    selectionStart: defaultCursor,
                }],
                viewState: {
                    firstPosition: { column: 1, lineNumber: 1 },
                    firstPositionDeltaTop: 0,
                    scrollLeft: 0,
                },
            };
        }
    }

    is(uri: monaco.Uri): boolean {
        return this.model.uri.toString() == uri.toString();
    }

    dispose(): void {
        this.model.dispose();
    }
}

// TODO: switch to React useId
let tabID = 0;
export function useTemporaryTab(initialCode: string): TabData {
    const [tab,] = useState(() => {
        const uri = monaco.Uri.from({ scheme: "temp", authority: String(tabID++), path: "/code.js" });
        return new TabData(uri, initialCode);
    });
    useEffect(() => () => tab.dispose(), []);
    return tab;
}
