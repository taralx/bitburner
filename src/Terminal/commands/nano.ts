import { ITerminal } from "../ITerminal";
import { IRouter } from "../../ui/Router";
import { IPlayer } from "../../PersonObjects/IPlayer";
import { BaseServer } from "../../Server/BaseServer";
import { Settings } from "../../Settings/Settings";

import { commonEditor } from "./common/editor";

export function nano(
  terminal: ITerminal,
  router: IRouter,
  player: IPlayer,
  server: BaseServer,
  args: (string | number | boolean)[],
): void {
  Settings.MonacoVim = false;
  return commonEditor("nano", { terminal, router, player, server, args });
}
