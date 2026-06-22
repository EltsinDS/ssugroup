import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { listPresets, applyPreset } from "../env";
import { getProjectComposeConfig } from "../config";
import { runComposeUp } from "../composeExec";
import { waitForContainersRunning } from "../waitForContainers";
import { warmUpHttpUrl } from "../waitForHttp";
import { getComposeCommand } from "../compose";

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openBrowserUrls(urls: string[]): Promise<void> {
  for (const url of urls) {
    await vscode.env.openExternal(vscode.Uri.parse(url));
  }
}

function resolveWarmupAndSecondaryUrls(
  openUrls: string[],
  warmupUrlSetting: string
): { warmupUrl: string | undefined; secondaryUrls: string[] } {
  if (openUrls.length === 0) {
    return { warmupUrl: undefined, secondaryUrls: [] };
  }

  const warmupUrl = warmupUrlSetting || openUrls[0];
  const secondaryUrls = openUrls.filter((url) => url !== warmupUrl);
  return { warmupUrl, secondaryUrls };
}

export async function startCommand(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  const cfg = getProjectComposeConfig(workspaceRoot);

  if (!fs.existsSync(cfg.presetsDir) || !fs.statSync(cfg.presetsDir).isDirectory()) {
    vscode.window.showErrorMessage(
      `Presets folder not found: ${cfg.presetsPathRel}. Add preset files (e.g. demo.env) there.`
    );
    return;
  }

  const presets = listPresets(cfg.presetsDir);
  if (presets.length === 0) {
    vscode.window.showErrorMessage(
      `No .env preset files in ${cfg.presetsPathRel} (e.g. demo.env).`
    );
    return;
  }

  if (!fs.existsSync(cfg.envTargetFile)) {
    vscode.window.showErrorMessage(`Env target file not found: ${cfg.envTargetFileRel}`);
    return;
  }

  if (!fs.existsSync(cfg.composeFile)) {
    vscode.window.showErrorMessage(`Compose file not found: ${cfg.composeFileRel}`);
    return;
  }

  const selected = await vscode.window.showQuickPick(presets, {
    placeHolder: "Select stand for local development",
    title: "Project: Start",
  });
  if (selected === undefined) return;

  try {
    applyPreset(cfg.envTargetFile, cfg.presetsDir, selected);
  } catch (e) {
    vscode.window.showErrorMessage(
      `Failed to apply preset "${selected}": ${e instanceof Error ? e.message : String(e)}`
    );
    return;
  }

  const toRemove: string[] = [];
  if (cfg.cleanNextOnStart) toRemove.push(".next");
  if (cfg.cleanNodeModulesOnStart) toRemove.push("node_modules");
  if (cfg.cleanYarnLockOnStart) toRemove.push("yarn.lock");

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

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Project Composer: starting (${selected})`,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: "docker compose up -d..." });

      const upResult = await runComposeUp(workspaceRoot, cfg.composeFileRel);
      if (!upResult.ok) {
        const composeCmd = `${getComposeCommand()} -f ${cfg.composeFileRel} up -d`;
        runInTerminal(workspaceRoot, composeCmd);
        vscode.window.showErrorMessage(
          `docker compose up failed. See terminal for details.${upResult.stderr ? ` ${upResult.stderr.trim()}` : ""}`
        );
        return;
      }

      if (cfg.waitForContainers.length > 0) {
        const waitResult = await waitForContainersRunning(
          workspaceRoot,
          cfg.composeFileRel,
          cfg.waitForContainers,
          cfg.waitTimeoutMs,
          (message) => progress.report({ message })
        );

        if (!waitResult.ok) {
          vscode.window.showWarningMessage(
            `Timeout waiting for containers: ${waitResult.missing.join(", ")}. Stack is up; open URLs manually if needed.`
          );
        }
      }

      const { warmupUrl, secondaryUrls } = resolveWarmupAndSecondaryUrls(
        cfg.openUrls,
        cfg.warmupUrl
      );

      if (cfg.openBrowserOnStart && cfg.warmupHttpOnStart && warmupUrl) {
        const warmed = await warmUpHttpUrl(
          warmupUrl,
          cfg.waitTimeoutMs,
          cfg.warmupRequestTimeoutMs,
          (message) => progress.report({ message })
        );

        if (!warmed) {
          vscode.window.showWarningMessage(
            `Warm-up timeout for ${warmupUrl}. Opening browser anyway — page may still be compiling.`
          );
        }
      }

      if (cfg.openBrowserOnStart) {
        if (!warmupUrl && cfg.openUrls.length === 0) {
          vscode.window.showWarningMessage(
            "openBrowserOnStart is enabled but openUrls is empty. Add URLs in projectComposeEnv.openUrls."
          );
        } else {
          progress.report({ message: "Opening browser..." });

          if (warmupUrl) {
            await openBrowserUrls([warmupUrl]);
          }

          if (secondaryUrls.length > 0) {
            if (cfg.secondaryUrlsDelayMs > 0) {
              progress.report({
                message: `Waiting ${cfg.secondaryUrlsDelayMs / 1000}s before secondary URLs...`,
              });
              await sleep(cfg.secondaryUrlsDelayMs);
            }
            await openBrowserUrls(secondaryUrls);
          }
        }
      }

      vscode.window.showInformationMessage(`Stand: ${selected}. Docker Compose is running.`);
    }
  );
}
