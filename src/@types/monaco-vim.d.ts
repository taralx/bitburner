/* eslint-disable */
// Mostly auto-extracted via tsc with some inlining.
declare module "monaco-vim/cm/keymap_vim" {
    class StringStream {
        constructor(string: any, tabSize: any);
        pos: number;
        start: number;
        string: any;
        tabSize: any;
        lastColumnPos: number;
        lastColumnValue: number;
        lineStart: number;
        eol: () => boolean;
        sol: () => boolean;
        peek: () => any;
        next: () => any;
        eat: (match: any) => any;
        eatWhile: (match: any) => boolean;
        eatSpace: () => boolean;
        skipToEnd(): void;
        skipTo(ch: any): boolean;
        backUp: (n: any) => void;
        column: () => never;
        indentation: () => never;
        match: (pattern: any, consume: any, caseInsensitive: any) => any;
        current: () => any;
        hideFirstChars: (n: any, inner: any) => any;
    }
    export default class VimMode {
        static Vim: {
            buildKeyMap: () => void;
            getRegisterController: () => any;
            resetVimGlobalState_: () => void;
            getVimGlobalState_: () => any;
            maybeInitVimState_: (cm: any) => any;
            suppressErrorLogging: boolean;
            InsertModeKey: typeof InsertModeKey;
            map: (lhs: any, rhs: any, ctx: any) => void;
            unmap: (lhs: any, ctx: any) => boolean;
            noremap: (lhs: any, rhs: any, ctx: any) => void;
            mapclear: (ctx: any) => void;
            setOption: (name: any, value: any, cm: any, cfg: any) => Error;
            getOption: (name: any, cm: any, cfg: any) => any;
            defineOption: (name: any, defaultValue: any, type: any, aliases: any, callback: any) => void;
            defineEx: (name: any, prefix: any, func: any) => void;
            handleKey: (cm: any, key: any, origin: any) => any;
            /**
             * This is the outermost function called by CodeMirror, after keys have
             * been mapped to their Vim equivalents.
             *
             * Finds a command based on the key (and cached keys if there is a
             * multi-key sequence). Returns `undefined` if no key is matched, a noop
             * function if a partial match is found (multi-key), and a function to
             * execute the bound command if a a key is matched. The function always
             * returns true.
             */
            findKey: (cm: any, key: any, origin: any) => () => any;
            handleEx: (cm: any, input: any) => void;
            defineMotion: (name: any, fn: any) => void;
            defineAction: (name: any, fn: any) => void;
            defineOperator: (name: any, fn: any) => void;
            mapCommand: (keys: any, type: any, name: any, args: any, extra: any) => void;
            _mapCommand: (command: any) => void;
            defineRegister: (name: any, register: any) => void;
            exitVisualMode: (cm: any, moveHead: any) => void;
            exitInsertMode: (cm: any) => void;
        };
        static Pos: typeof Pos;
        static signal: typeof signal;
        static on: () => void;
        static off: () => void;
        static addClass: () => void;
        static rmClass: () => void;
        static defineOption: () => void;
        static keyMap: {
            default: (key: any) => (cm: any) => boolean;
        };
        static matchingBrackets: {
            "(": string;
            ")": string;
            "[": string;
            "]": string;
            "{": string;
            "}": string;
            "<": string;
            ">": string;
        };
        static isWordChar: typeof isWordCharBasic;
        static keyName: typeof monacoToCmKey;
        static StringStream: typeof StringStream;
        static e_stop: (e: any) => boolean;
        static e_preventDefault: (e: any) => boolean;
        static commands: {
            redo: (cm: any) => void;
            undo: (cm: any) => void;
            newlineAndIndent: (cm: any) => void;
        };
        static lookupKey: (key: any, map: any, handle: any) => any;
        static defineExtension: (name: any, fn: any) => void;
        constructor(editor: any);
        editor: any;
        state: {
            keyMap: string;
        };
        marks: {};
        $uid: number;
        disposables: any[];
        listeners: {};
        curOp: {};
        attached: boolean;
        statusBar: any;
        options: {};
        ctxInsert: any;
        attach(): void;
        addLocalListeners(): void;
        handleKeyDown: (e: any) => void;
        handleReplaceMode(key: any, e: any): void;
        replaceStack: any[];
        handleCursorChange: (e: any) => void;
        handleChange: (e: any) => void;
        setOption(key: any, value: any): void;
        getConfiguration(): any;
        getOption(key: any): any;
        dispatch(signal: any, ...args: any[]): void;
        on(event: any, handler: any): void;
        off(event: any, handler: any): void;
        firstLine(): number;
        lastLine(): number;
        lineCount(): any;
        defaultTextHeight(): number;
        getLine(line: any): any;
        getAnchorForSelection(selection: any): any;
        getHeadForSelection(selection: any): any;
        getCursor(type?: any): Pos;
        getRange(start: any, end: any): any;
        getSelection(): string;
        replaceRange(text: any, start: any, end: any): void;
        pushUndoStop(): void;
        setCursor(line: any, ch: any): void;
        somethingSelected(): boolean;
        operation(fn: any, force: any): any;
        listSelections(): any;
        focus(): void;
        setSelections(selections: any, primIndex: any): void;
        setSelection(frm: any, to: any): void;
        getSelections(): any;
        replaceSelections(texts: any): void;
        toggleOverwrite(toggle: any): void;
        replaceMode: boolean;
        charCoords(pos: any, mode: any): {
            top: any;
            left: any;
        };
        coordsChar(pos: any, mode: any): void;
        clipPos(p: any): Pos;
        setBookmark(cursor: any, options: any): Marker;
        getScrollInfo(): {
            left: number;
            top: number;
            height: any;
            clientHeight: number;
        };
        triggerEditorAction(action: any): void;
        dispose(): void;
        getInputField(): void;
        getWrapperElement(): void;
        enterVimMode(toVim?: boolean): void;
        initialCursorWidth: any;
        leaveVimMode(): void;
        virtualSelectionMode(): any;
        markText(): {
            clear: () => void;
            find: () => void;
        };
        getUserVisibleLines(): {
            top: number;
            bottom: number;
        };
        findPosV(startPos: any, amount: any, unit: any): Pos;
        findMatchingBracket(pos: any): {
            to: Pos;
        };
        findFirstNonWhiteSpaceCharacter(line: any): number;
        scrollTo(x: any, y: any): void;
        moveCurrentLineTo(viewPosition: any): void;
        getSearchCursor(query: any, pos: any): {
            getMatches(): any;
            findNext(): any;
            findPrevious(): any;
            jumpTo(index: any): any;
            find(back: any): any;
            from(): Pos;
            to(): Pos;
            replace(text: any): void;
        };
        highlightRanges(ranges: any, className?: string): any;
        addOverlay({ query }: {
            query: any;
        }, hasBoundary: any, style: any): void;
        removeOverlay(): void;
        scrollIntoView(pos: any): void;
        moveH(units: any, type: any): void;
        scanForBracket(pos: any, dir: any, dd: any, config: any): {
            pos: Pos;
        };
        indexFromPos(pos: any): any;
        posFromIndex(offset: any): Pos;
        indentLine(line: any, indentRight?: boolean): void;
        setStatusBar(statusBar: any): void;
        openDialog(html: any, callback: any, options: any): any;
        openNotification(html: any): void;
        smartIndent(): void;
        moveCursorTo(to: any): void;
        execCommand(command: any): void;
    }
    function Pos(line: any, column: any): Pos;
    class Pos {
        constructor(line: any, column: any);
        line: any;
        ch: any;
    }
    class Marker {
        constructor(cm: any, id: any, line: any, ch: any);
        cm: any;
        id: any;
        lineNumber: any;
        column: any;
        clear(): void;
        find(): Pos;
    }
    function signal(cm: any, signal: any, args: any): void;
    function isWordCharBasic(ch: any): boolean;
    function monacoToCmKey(e: any, skip?: boolean): any;

    /** Wrapper for special keys pressed in insert mode */
    export function InsertModeKey(keyName: any): void;
    export class InsertModeKey {
        /** Wrapper for special keys pressed in insert mode */
        constructor(keyName: any);
        keyName: any;
    }
}
declare module "monaco-vim/statusbar" {
    export default class VimStatusBar {
        constructor(node: any, editor: any, sanitizer?: any);
        node: any;
        modeInfoNode: HTMLSpanElement;
        secInfoNode: HTMLSpanElement;
        notifNode: HTMLSpanElement;
        keyInfoNode: HTMLSpanElement;
        editor: any;
        sanitizer: any;
        setMode(ev: any): void;
        setKeyBuffer(key: any): void;
        setSec(text: any, callback: any, options: any): () => void;
        input: {
            callback: any;
            options: any;
            node: HTMLInputElement;
        };
        setText(text: any): void;
        toggleVisibility(toggle: any): void;
        closeInput: () => void;
        clear: () => void;
        inputKeyUp: (e: any) => void;
        inputKeyInput: (e: any) => void;
        inputBlur: () => void;
        inputKeyDown: (e: any) => void;
        addInputListeners(): void;
        removeInputListeners(): void;
        showNotification(text: any): void;
        notifTimeout: NodeJS.Timeout;
        setInnerHtml_(element: any, htmlContents: any): void;
    }
}
declare module "monaco-vim" {
    export function initVimMode(editor: any, statusbarNode?: any, StatusBarClass?: typeof StatusBar, sanitizer?: any): VimMode;
    export { default as StatusBar } from "monaco-vim/statusbar";
    export { default as VimMode } from "monaco-vim/cm/keymap_vim";
}
