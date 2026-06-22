import { execFile } from "child_process";
import { promisify } from "util";
import { getComposeCommand } from "./compose";

const execFileAsync = promisify(execFile);

const POLL_INTERVAL_MS = 2_000;

interface ComposePsRow {
  Name?: string;
  State?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseComposePs(stdout: string): ComposePsRow[] {
  const rows: ComposePsRow[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      rows.push(JSON.parse(trimmed) as ComposePsRow);
    } catch {
      // skip malformed line
    }
  }
  return rows;
}

/** Match full name, suffix `-token`, or name ending with `token`. */
export function containerMatchesToken(containerName: string, token: string): boolean {
  if (containerName === token) return true;
  if (containerName.endsWith(`-${token}`)) return true;
  if (containerName.endsWith(token)) return true;
  return false;
}

function isRunning(state: string | undefined): boolean {
  return (state ?? "").toLowerCase() === "running";
}

async function fetchRunningContainerNames(
  workspaceRoot: string,
  composeFileRel: string
): Promise<string[]> {
  const composeCmd = getComposeCommand();
  const executable = composeCmd === "docker compose" ? "docker" : "docker-compose";
  const args =
    composeCmd === "docker compose"
      ? ["compose", "-f", composeFileRel, "ps", "--format", "json"]
      : ["-f", composeFileRel, "ps", "--format", "json"];

  const { stdout } = await execFileAsync(executable, args, {
    cwd: workspaceRoot,
    maxBuffer: 10 * 1024 * 1024,
  });

  return parseComposePs(stdout)
    .filter((row) => isRunning(row.State))
    .map((row) => row.Name ?? "")
    .filter(Boolean);
}

function findMissingTokens(runningNames: string[], tokens: string[]): string[] {
  return tokens.filter(
    (token) => !runningNames.some((name) => containerMatchesToken(name, token))
  );
}

export async function waitForContainersRunning(
  workspaceRoot: string,
  composeFileRel: string,
  tokens: string[],
  timeoutMs: number,
  onProgress?: (message: string) => void
): Promise<{ ok: boolean; missing: string[] }> {
  if (tokens.length === 0) {
    return { ok: true, missing: [] };
  }

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const runningNames = await fetchRunningContainerNames(workspaceRoot, composeFileRel);
      const missing = findMissingTokens(runningNames, tokens);

      if (missing.length === 0) {
        return { ok: true, missing: [] };
      }

      onProgress?.(`Waiting for containers: ${missing.join(", ")}`);
    } catch {
      onProgress?.("Waiting for docker compose...");
    }

    await sleep(POLL_INTERVAL_MS);
  }

  try {
    const runningNames = await fetchRunningContainerNames(workspaceRoot, composeFileRel);
    const missing = findMissingTokens(runningNames, tokens);
    return { ok: missing.length === 0, missing };
  } catch {
    return { ok: false, missing: tokens };
  }
}
