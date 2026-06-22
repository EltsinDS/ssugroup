import * as vscode from "vscode";
import * as path from "path";

export interface ProjectComposeConfig {
  presetsDir: string;
  presetsPathRel: string;
  envTargetFile: string;
  envTargetFileRel: string;
  composeFile: string;
  composeFileRel: string;
  cleanNextOnStart: boolean;
  cleanNodeModulesOnStart: boolean;
  cleanYarnLockOnStart: boolean;
  openBrowserOnStart: boolean;
  openUrls: string[];
  waitForContainers: string[];
  waitTimeoutMs: number;
  warmupHttpOnStart: boolean;
  warmupUrl: string;
  warmupRequestTimeoutMs: number;
  secondaryUrlsDelayMs: number;
}

export function getProjectComposeConfig(workspaceRoot: string): ProjectComposeConfig {
  const config = vscode.workspace.getConfiguration("projectComposeEnv");

  const presetsPathRel = config.get<string>("presetsPath") ?? "development/.env.presets";
  const envTargetFileRel = config.get<string>("envTargetFile") ?? "development/.env.development";
  const composeFileRel = config.get<string>("composeFile") ?? "development/docker-compose.yml";

  const waitRaw = config.get<string>("waitForContainers")?.trim() ?? "";
  const waitForContainers = waitRaw ? waitRaw.split(/\s+/).filter(Boolean) : [];

  const warmupHttpOnStart =
    config.get<boolean>("warmupHttpOnStart") ??
    config.get<boolean>("waitForHttpOnStart") ??
    true;

  return {
    presetsDir: path.join(workspaceRoot, presetsPathRel),
    presetsPathRel,
    envTargetFile: path.join(workspaceRoot, envTargetFileRel),
    envTargetFileRel,
    composeFile: path.join(workspaceRoot, composeFileRel),
    composeFileRel,
    cleanNextOnStart: config.get<boolean>("cleanNextOnStart") ?? false,
    cleanNodeModulesOnStart: config.get<boolean>("cleanNodeModulesOnStart") ?? false,
    cleanYarnLockOnStart: config.get<boolean>("cleanYarnLockOnStart") ?? false,
    openBrowserOnStart: config.get<boolean>("openBrowserOnStart") ?? false,
    openUrls: config.get<string[]>("openUrls") ?? [],
    waitForContainers,
    waitTimeoutMs: config.get<number>("waitTimeoutMs") ?? 300_000,
    warmupHttpOnStart,
    warmupUrl: config.get<string>("warmupUrl")?.trim() ?? "",
    warmupRequestTimeoutMs: config.get<number>("warmupRequestTimeoutMs") ?? 120_000,
    secondaryUrlsDelayMs: config.get<number>("secondaryUrlsDelayMs") ?? 5_000,
  };
}
