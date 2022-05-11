import netscriptLib from "!!raw-loader!../NetscriptDefinitions.d.ts";
import * as monaco from "monaco-editor";
import React, { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { Settings } from "src/Settings/Settings";
import { TabData, useTemporaryTab } from "./TabData";
import { loadThemes, makeTheme, sanitizeTheme } from "./themes";
import { CodeEditor } from "./Types";

let monacoInitComplete = false;
function monacoOneTimeInit(): void {
    if (monacoInitComplete) return;
    // It's important that the "export" keyword not show up or TS will not treat the module as ambient.
    // TODO: Do this via SourceFile manipulation instead.
    monaco.languages.typescript.javascriptDefaults.addExtraLib(netscriptLib.replace(/export /g, ""));
    loadThemes(monaco);
    sanitizeTheme(Settings.EditorTheme);
    monaco.editor.defineTheme("customTheme", makeTheme(Settings.EditorTheme));
    monacoInitComplete = true;
}

export type EditorOptions = monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions;

export interface EditorProps {
    className?: string;
    onChange?: () => void;
    options?: EditorOptions;
    style?: React.CSSProperties;
    tab: TabData;
}

export const Editor = React.forwardRef((props: EditorProps, ref?: React.Ref<CodeEditor | null>): React.ReactElement => {
    monacoOneTimeInit();

    const editorRef = useRef<CodeEditor | null>(null);
    const setContainer = useCallback((container: HTMLDivElement | null) => {
        if (editorRef.current != null) {
            if (editorRef.current.getContainerDomNode() === container)
                return;
            editorRef.current.dispose();
        }
        if (container == null) {
            editorRef.current = null;
            return;
        }
        editorRef.current = monaco.editor.create(container, props.options);
        editorRef.current.focus();
    }, []);

    // Expose the CodeEditor object as our ref.
    useImperativeHandle(ref, () => editorRef.current, []);

    // Sync the model and view state with the editor. (View state only updated
    // on model change and unmount.) useLayoutEffect is needed so that we can
    // save the view state before re-render, which can dispose of the editor.
    useLayoutEffect(() => {
        const editor = editorRef.current;
        if (editor == null)
            throw new Error("react failed to call setContainer");
        editor.setModel(props.tab.model);
        if (props.tab != null) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- typings are wrong.
            editor.restoreViewState(props.tab.viewState!);
            return () => { props.tab.viewState = editor.saveViewState(); };
        }
    }, [props.tab]);

    // Sync options with the editor.
    useEffect(() => {
        if (editorRef.current == null || props.options == null) return;
        editorRef.current.updateOptions(props.options);
    }, [props.options]);

    // Subscribe to onDidChangeModelContent and use it to mark the tab dirty.
    useEffect(() => {
        if (editorRef.current == null || props.tab == null || props.onChange == null) return;
        const subscription = editorRef.current.onDidChangeModelContent(props.onChange);
        return subscription.dispose;
    }, [props.tab]);

    return <div ref={setContainer} className={props.className} style={props.style} />;
});

interface UncontrolledEditorProps extends Omit<EditorProps, "tab"> {
    initialCode: string;
}

export function UncontrolledEditor({initialCode, ...props}: UncontrolledEditorProps): React.ReactElement {
    const tab = useTemporaryTab(initialCode);
    return tab ? <Editor tab={tab} {...props} /> : <></>;
}
