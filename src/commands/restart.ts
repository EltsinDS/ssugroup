import * as vscode from "vscode";
import { getComposeCommand } from "../compose";
import { getProjectComposeConfig } from "../config";

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

  const cfg = getProjectComposeConfig(workspaceRoot);
  const config = vscode.workspace.getConfiguration("projectComposeEnv");
  const services = config.get<string>("restartServices")?.trim();

  const serviceArg = services ? ` ${services}` : "";
  const restartCmd = `${getComposeCommand()} -f ${cfg.composeFileRel} restart${serviceArg}`;

  vscode.window.showInformationMessage(
    services
      ? `Restarting services: ${services}...`
      : "Restarting docker-compose services..."
  );
  runInTerminal(workspaceRoot, restartCmd, "Project Restart");
}
