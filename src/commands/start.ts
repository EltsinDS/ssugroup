import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
  listPresets,
  applyPresetToEnvDevelopment,
  envDevelopmentPath,
} from "../env";
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

export async function startCommand(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  const presetsDir = path.join(workspaceRoot, "development", ".env.presets");
  const envPath = envDevelopmentPath(workspaceRoot);

  if (!fs.existsSync(presetsDir) || !fs.statSync(presetsDir).isDirectory()) {
    vscode.window.showErrorMessage(
      "Folder development/.env.presets not found. Add preset files (e.g. demo.env) there."
    );
    return;
  }

  const presets = listPresets(workspaceRoot);
  if (presets.length === 0) {
    vscode.window.showErrorMessage(
      "No .env preset files in development/.env.presets (e.g. demo.env)."
    );
    return;
  }

  if (!fs.existsSync(envPath)) {
    vscode.window.showErrorMessage("development/.env.development not found.");
    return;
  }

  const selected = await vscode.window.showQuickPick(presets, {
    placeHolder: "Select stand for local development",
    title: "Project: Start",
  });
  if (selected === undefined) return;

  try {
    applyPresetToEnvDevelopment(workspaceRoot, selected);
  } catch (e) {
    vscode.window.showErrorMessage(
      `Failed to apply preset "${selected}": ${e instanceof Error ? e.message : String(e)}`
    );
    return;
  }

  const config = vscode.workspace.getConfiguration("projectComposeEnv");
  const cleanNext = config.get<boolean>("cleanNextOnStart") ?? false;
  const cleanNodeModules = config.get<boolean>("cleanNodeModulesOnStart") ?? false;
  const cleanYarnLock = config.get<boolean>("cleanYarnLockOnStart") ?? false;

  const toRemove: string[] = [];
  if (cleanNext) toRemove.push(".next");
  if (cleanNodeModules) toRemove.push("node_modules");
  if (cleanYarnLock) toRemove.push("yarn.lock");

  for (const rel of toRemove) {
    const full = path.join(workspaceRoot, rel);
    if (fs.existsSync(full)) {
      try {
        fs.rmSync(full, { recursive: true, force: true });
      } catch (err) {
        vscode.window.showWarningMessage(
          `Could not remove ${rel}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  vscode.window.showInformationMessage(`Stand: ${selected}. Starting docker-compose...`);

  const composeCmd = `${getComposeCommand()} -f ${COMPOSE_FILE} up -d`;
  runInTerminal(workspaceRoot, composeCmd);
}
