import * as vscode from "vscode";
import { getDockerCleanCommand } from "./clean";
import { getComposeCommand } from "../compose";

const COMPOSE_FILE = "development/docker-compose.yml";

function getWorkspaceRoot(): string | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath;
}

function runInTerminal(workspaceRoot: string, command: string, name?: string): void {
  const terminal = vscode.window.createTerminal({
    cwd: workspaceRoot,
    name: name ?? "Project Composer",
  });
  terminal.show();
  terminal.sendText(command);
}

export async function stopCommand(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  const config = vscode.workspace.getConfiguration("projectComposeEnv");
  const dockerCleanOnStop = config.get<boolean>("dockerCleanOnStop") ?? false;

  const downCmd = `${getComposeCommand()} -f ${COMPOSE_FILE} down`;
  if (dockerCleanOnStop) {
    const cleanCmd = getDockerCleanCommand();
    runInTerminal(workspaceRoot, `${downCmd}; ${cleanCmd}`, "Project Stop");
  } else {
    runInTerminal(workspaceRoot, downCmd);
  }
}
