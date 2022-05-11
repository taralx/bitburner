import { ITerminal } from "../../ITerminal";
import { removeLeadingSlash, removeTrailingSlash } from "../../DirectoryHelpers";
import { IRouter } from "../../../ui/Router";
import { IPlayer } from "../../../PersonObjects/IPlayer";
import { BaseServer } from "../../../Server/BaseServer";
import { isScriptFilename } from "../../../Script/isScriptFilename";
import { Script } from "../../../Script/Script";
import { isEmpty } from "lodash";
import { tabManager } from "../../../ScriptEditor/ui/NewScriptEditor";

interface EditorParameters {
  terminal: ITerminal;
  router: IRouter;
  player: IPlayer;
  server: BaseServer;
  args: (string | number | boolean)[];
}


interface ISimpleScriptGlob {
  glob: string;
  preGlob: string;
  postGlob: string;
  globError: string;
  globMatches: string[];
  globAgainst: Script[];
}

function containsSimpleGlob(filename: string): boolean {
  return filename.includes("*");
}

function detectSimpleScriptGlob(
  args: EditorParameters["args"],
  player: IPlayer,
  terminal: ITerminal,
): ISimpleScriptGlob | null {
  if (args.length == 1 && containsSimpleGlob(`${args[0]}`)) {
    const filename = `${args[0]}`;
    const scripts = player.getCurrentServer().scripts;
    const parsedGlob = parseSimpleScriptGlob(filename, scripts, terminal);
    return parsedGlob;
  }
  return null;
}

function parseSimpleScriptGlob(globString: string, globDatabase: Script[], terminal: ITerminal): ISimpleScriptGlob {
  const parsedGlob: ISimpleScriptGlob = {
    glob: globString,
    preGlob: "",
    postGlob: "",
    globError: "",
    globMatches: [],
    globAgainst: globDatabase,
  };

  // Ensure deep globs are minified to simple globs, which act as deep globs in this impl
  globString = globString.replace("**", "*");

  // Ensure only a single glob is present
  if (globString.split("").filter((c) => c == "*").length !== 1) {
    parsedGlob.globError = "Only a single glob is supported per command.\nexample: `nano my-dir/*.js`";
    return parsedGlob;
  }

  // Split arg around glob, normalize preGlob path
  [parsedGlob.preGlob, parsedGlob.postGlob] = globString.split("*");
  parsedGlob.preGlob = removeLeadingSlash(parsedGlob.preGlob);

  // Add CWD to preGlob path
  const cwd = removeTrailingSlash(terminal.cwd());
  parsedGlob.preGlob = `${cwd}/${parsedGlob.preGlob}`;

  // For every script on the current server, filter matched scripts per glob values & persist
  globDatabase.forEach((script) => {
    const filename = script.filename.startsWith("/") ? script.filename : `/${script.filename}`;
    if (filename.startsWith(parsedGlob.preGlob) && filename.endsWith(parsedGlob.postGlob)) {
      parsedGlob.globMatches.push(filename);
    }
  });

  // Rebuild glob for potential error reporting
  parsedGlob.glob = `${parsedGlob.preGlob}*${parsedGlob.postGlob}`;

  return parsedGlob;
}

export function commonEditor(
  command: string,
  { terminal, router, player, args }: EditorParameters,
): void {
  if (args.length < 1) {
    terminal.error(`Incorrect usage of ${command} command. Usage: ${command} [scriptname]`);
    return;
  }

  let filesToLoadOrCreate = args;
  try {
    const globSearch = detectSimpleScriptGlob(args, player, terminal);
    if (globSearch) {
      if (isEmpty(globSearch.globError) === false) throw new Error(globSearch.globError);
      filesToLoadOrCreate = globSearch.globMatches;
    }

    const files = filesToLoadOrCreate.map((arg): [string, string?] => {
      const filename = arg.toString();

      if (isScriptFilename(filename)) {
        const filepath = terminal.getFilepath(filename);
        const script = terminal.getScript(player, filename);
        return [filepath, script?.code];
      }

      if (filename.endsWith(".txt")) {
        const filepath = terminal.getFilepath(filename);
        const txt = terminal.getTextFile(player, filename);
        return [filepath, txt?.text];
      }

      throw new Error(
        `Invalid file. Only scripts (.script, .ns, .js), or text files (.txt) can be edited with ${command}`,
      );
    });
    const server = player.getCurrentServer().hostname;
    for (const [filepath, code] of files) {
      tabManager.open(server, filepath, code);
    }

    if (globSearch && files.length === 0) {
      throw new Error(`Could not find any valid files to open with ${command} using glob: \`${globSearch.glob}\``);
    }

    router.toScriptEditor();
  } catch (e) {
    terminal.error(`${e}`);
  }
}
