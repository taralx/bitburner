/* eslint @typescript-eslint/comma-dangle: ["error", "always-multiline"] */
/* eslint @typescript-eslint/quotes: ["error", "double", {"avoidEscape": true}] */
/* eslint @typescript-eslint/semi: ["error", "always", {"omitLastInOneLineBlock": true}] */

import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import SyncIcon from "@mui/icons-material/Sync";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import { initVimMode, VimMode } from "monaco-vim";
import Typography from "@mui/material/Typography";
import * as monaco from "monaco-editor";
import React, { useEffect, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import { IPlayer } from "src/PersonObjects/IPlayer";
import { Script } from "src/Script/Script";
import { GetServer } from "src/Server/AllServers";
import { Settings } from "src/Settings/Settings";
import { use } from "src/ui/Context";
import { prompt } from "src/ui/React/PromptManager";
import { Editor } from "./Editor";
import { Options, OptionsModal } from "./OptionsModal";
import "./script-editor.css";
import { TabData } from "./TabData";
import { CodeEditor } from "./Types";

function normalize(filename: string): string {
    if (filename.startsWith("/")) return filename;
    return "/" + filename;
}

function denormalize(path: string): string {
    if (path.lastIndexOf("/") > 0) return path;
    return path.substring(1);
}

class InternalTabState {
    tabs: TabData[] = [];
    current?: TabData;
}
export type TabState = Readonly<InternalTabState>;

export const [tabManager, useTabState] = (function () {
    // TODO: get model management out of here. maybe just store uris
    const state = new InternalTabState();
    const observers = new Set<(state: TabState) => void>();

    const tabManager = {
        get current(): TabData | undefined {
            return state.current;
        },
        open(server: string, filename: string, code?: string): void {
            const uri = monaco.Uri.from({
                scheme: "bb",
                authority: server,
                path: normalize(filename),
            });
            if (state.current?.is(uri)) return;
            const index = state.tabs.findIndex(tab => tab.is(uri));
            if (index < 0) {
                state.tabs.push(state.current = new TabData(uri, code));
            } else {
                state.current = state.tabs[index];
            }
            update();
        },
        openScript(script: Script): void {
            this.open(script.server, script.filename, script.code);
        },
        select(tab: TabData): void {
            state.current = tab;
            update();
        },
        selectDelta(delta: number): void {
            if (state.current == null) return;
            const index = state.tabs.indexOf(state.current);
            if (index < 0) return;
            const n = state.tabs.length;
            this.select(state.tabs[(index + n + delta % n) % n]);
        },
        move(fromIndex: number, toIndex: number): void {
            if (fromIndex === toIndex) return;
            state.tabs.splice(toIndex, 0, ...state.tabs.splice(fromIndex, 1));
            update();
        },
        setDirty(tab: TabData): void {
            (tab as {dirty: boolean}).dirty = true;
            update();
        },
        reload(tab: TabData): void {
            const server = GetServer(tab.model.uri.authority);
            if (server == null) return;
            const filename = tab.model.uri.path;
            const script = server.scripts.find(script => normalize(script.filename) === filename);
            if (script == null || tab.model.getValue() === script.code) return;
            tab.model.setValue(script.code);
            // no update required
        },
        save(tab: TabData, player: IPlayer): void {
            const server = GetServer(tab.model.uri.authority);
            if (server == null) return;
            const filename = tab.model.uri.path;
            let script = server.scripts.find(script => normalize(script.filename) === filename);
            if (script == null) {
                script = new Script();
                server.scripts.push(script);
            }
            script.saveScript(player, denormalize(filename), tab.model.getValue(), server.hostname, server.scripts);
            (tab as {dirty: boolean}).dirty = false;
            update();
        },
        close(index: number): boolean {
            const tab = state.tabs[index];
            state.tabs.splice(index, 1)[0].dispose();
            if (tab === state.current) {
                state.current = state.tabs[index && index - 1];
            }
            update();
            return state.tabs.length > 0;
        },
    };

    function update(): void {
        // Make a (shallow) copy to force re-render.
        const copy = { tabs: state.tabs, current: state.current };
        observers.forEach(o => o(copy));
    }
    function useTabState(): TabState {
        // TODO: switch to useSyncExternalStore from React 18.
        const [hookState, setState] = useState<TabState>(state);
        observers.add(setState);  // setState is constant across invocations.
        useEffect(() => () => { observers.delete(setState) }, []);
        return hookState;
    }
    return [tabManager, useTabState];
})();

function Tab({ tabState, tab, index }: { tabState: TabState; tab: TabData; index: number }): React.ReactElement {
    const player = use.Player();
    const router = use.Router();

    const tabName = tab.model.uri.authority + ":~" + tab.model.uri.path;
    async function onClose(): Promise<void> {
        if (tab.dirty) {
            const msg = `Do you want to save changes to ${tab.model.uri.path}?`;
            const response = await prompt(msg);
            if (response == null) return; // prompt dismissed - abort close
            if (response) tabManager.save(tab, player);
        }
        if (!tabManager.close(index)) router.toTerminal();
    }
    async function onReload(): Promise<void> {
        if (tab.dirty) {
            const msg = `Do you want to overwrite the current editor content with the contents of ${tab.model.uri.path} on the server? This cannot be undone.`;
            if (await prompt(msg)) tabManager.reload(tab);
        }
    }

    return <Draggable disableInteractiveElementBlocking={true} draggableId={tabName} index={index}>
        {provided => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                className={"script-editor-tab " + (tabState.current === tab ? "" : " tab-not-active")}
                onMouseDownCapture={e => { if (e.button === 1) { e.stopPropagation(); onClose() } }}
            >
                <Tooltip title={tabName}>
                    <Button
                        onClick={() => tabManager.select(tab)}
                        {...provided.dragHandleProps}
                    >
                        {tab.dirty && <>*&nbsp;</>}
                        <span className="script-editor-tab-title">
                            {tabName}
                        </span>
                    </Button>
                </Tooltip>
                <Tooltip title="Overwrite editor content with saved file content">
                    <Button className="icon-button" onClick={onReload}>
                        <SyncIcon fontSize="small" />
                    </Button>
                </Tooltip>
                <Button className="icon-button" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </Button>
            </div>
        )}
    </Draggable>;
}

function TabBar({ tabState }: { tabState: TabState }): React.ReactElement {
    function onDragEnd(result: DropResult): void {
        if (result.destination == null) return;
        tabManager.move(result.source.index, result.destination.index);
    }

    return <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tabs" direction="horizontal">
            {(provided, snapshot) => (
                <div
                    className={"script-editor-tabs " + (snapshot.isDraggingOver ? "drag-active" : "")}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                    {tabState.tabs.map((tab, index) => (
                        <Tab tabState={tabState} tab={tab} index={index} key={tab.model.uri.toString()} />
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </DragDropContext>;
}

function EmptyView(): React.ReactElement {
    return <div className="script-editor-empty">
        <div>
            <Typography variant="h4">No open files</Typography>
            <Typography variant="h5">
                Use <code>nano FILENAME</code> in<br />
                the terminal to open files
            </Typography>
        </div>
    </div>;
}

export function Root(): React.ReactElement {
    const player = use.Player();
    const router = use.Router();

    const tabState = useTabState();
    const editorRef = useRef<CodeEditor>(null);
    const vimStatusRef = useRef<HTMLDivElement>(null);

    const [optionsOpen, setOptionsOpen] = useState(false);
    const [options, setOptions] = useState<Options>({
        automaticLayout: true,
        fontSize: Settings.MonacoFontSize,
        insertSpaces: Settings.MonacoInsertSpaces,
        theme: Settings.MonacoTheme,
        wordWrap: Settings.MonacoWordWrap,
    });
    useEffect(() => {
        Settings.MonacoFontSize = options.fontSize;
        Settings.MonacoInsertSpaces = options.insertSpaces;
        Settings.MonacoTheme = options.theme;
        Settings.MonacoWordWrap = options.wordWrap;
        if (Settings.MonacoVim && editorRef.current != null) {
            const vimEditor = initVimMode(editorRef.current, vimStatusRef.current);
            VimMode.Vim.defineEx("write", "w", function () {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                tabManager.save(tabManager.current!, player);
            });
            VimMode.Vim.defineEx("quit", "q", function () {
                router.toTerminal();
            });
            // "wqriteandquit" is not a typo, prefix must be found in full string
            VimMode.Vim.defineEx("wqriteandquit", "wq", function () {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                tabManager.save(tabManager.current!, player);
                router.toTerminal();
            });

            // Setup "go to next tab" and "go to previous tab". This is a little more involved
            // since these aren't Ex commands (they run in normal mode, not after typing `:`)
            VimMode.Vim.defineAction("nextTabs", function (_cm: unknown, args: { repeat?: number }) {
                tabManager.selectDelta(args.repeat ?? 1);
            });
            VimMode.Vim.defineAction("prevTabs", function (_cm: unknown, args: { repeat?: number }) {
                tabManager.selectDelta(-(args.repeat ?? 1));
            });
            VimMode.Vim.mapCommand("gt", "action", "nextTabs", {}, { context: "normal" });
            VimMode.Vim.mapCommand("gT", "action", "prevTabs", {}, { context: "normal" });
            return () => vimEditor.dispose();
        }
    }, [options]);

    const tab = tabState.current;
    if (tab == null) return <EmptyView />;

    const beautify = (): void => { editorRef.current?.getAction("editor.action.formatDocument").run() };
    const save = (): void => tabManager.save(tab, player);
    const onKeyDown = (event: React.KeyboardEvent): void => {
        if (Settings.DisableHotkeys) return;
        if (!event.ctrlKey && !event.metaKey) return;
        switch (event.key) {
            case "b":
                event.preventDefault();
                router.toTerminal();
                break;
            case "s":
                event.preventDefault();
                save();
                break;
        }
    };
    return (
        <div
            className="script-editor-root"
            onKeyDownCapture={onKeyDown}
            style={{
                "--button": Settings.theme.button,
                "--secondary": Settings.theme.secondary,
                "--backgroundsecondary": Settings.theme.backgroundsecondary,
            } as React.CSSProperties}
        >
            <TabBar tabState={tabState} />
            <Editor ref={editorRef} className="script-editor" options={options} onChange={() => tabManager.setDirty(tab)} tab={tab} />
            <div ref={vimStatusRef} className="monaco-editor script-editor-status" />
            <div className="script-editor-buttons">
                <Button onClick={() => setOptionsOpen(true)} startIcon={<SettingsIcon />}>Options</Button>
                <Button onClick={beautify}>Beautify</Button>
                <Button>(RAM placeholder)</Button>
                <Button onClick={save}>Save (Ctrl/Cmd + s)</Button>
                <Button onClick={router.toTerminal}>Terminal (Ctrl/Cmd + b)</Button>
                <Typography>
                    <strong>Documentation:</strong>&nbsp;
                    <Link target="_blank" href="https://bitburner.readthedocs.io/en/latest/index.html">
                        Basic
                    </Link>
                    &nbsp;|&nbsp;
                    <Link target="_blank" href="https://github.com/danielyxie/bitburner/blob/dev/markdown/bitburner.ns.md">
                        Full
                    </Link>
                </Typography>
            </div>
            <OptionsModal
                open={optionsOpen}
                onClose={() => setOptionsOpen(false)}
                options={options}
                vim={Settings.MonacoVim}
                save={(newOptions, newVim) => {
                    setOptions(newOptions);
                    // This works because setOptions will trigger re-render.
                    Settings.MonacoVim = newVim;
                }}
            />
        </div>
    );
}
