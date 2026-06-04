import * as vscode from "vscode";
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

export async function restartCommand(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  const config = vscode.workspace.getConfiguration("projectComposeEnv");
  const services = config.get<string>("restartServices")?.trim();

  const serviceArg = services ? ` ${services}` : "";
  const restartCmd = `${getComposeCommand()} -f ${COMPOSE_FILE} restart${serviceArg}`;

  vscode.window.showInformationMessage(
    services
      ? `Restarting services: ${services}...`
      : "Restarting docker-compose services..."
  );
  runInTerminal(workspaceRoot, restartCmd, "Project Restart");
}
