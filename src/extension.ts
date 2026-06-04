import * as vscode from "vscode";
import { startCommand } from "./commands/start";
import { stopCommand } from "./commands/stop";
import { restartCommand } from "./commands/restart";
import { dockerCleanCommand } from "./commands/clean";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("projectComposeEnv.start", startCommand)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("projectComposeEnv.stop", stopCommand)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("projectComposeEnv.restart", restartCommand)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("projectComposeEnv.dockerClean", dockerCleanCommand)
  );
}

export function deactivate(): void {}
