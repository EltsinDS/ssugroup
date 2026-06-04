import * as vscode from "vscode";

export function getDockerCleanCommand(): string {
  return [
    "docker system prune -a -f",
    "docker volume prune -f",
    "docker image prune -a -f",
    "docker builder prune -a -f",
  ].join("; ");
}

function getWorkspaceRoot(): string | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath;
}

function runInTerminal(workspaceRoot: string, command: string): void {
  const terminal = vscode.window.createTerminal({
    cwd: workspaceRoot,
    name: "Docker Clean",
  });
  terminal.show();
  terminal.sendText(command);
}

export async function dockerCleanCommand(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  runInTerminal(workspaceRoot, getDockerCleanCommand());
}
