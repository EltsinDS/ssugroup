import { execFile } from "child_process";
import { promisify } from "util";
import { getComposeCommand } from "./compose";

const execFileAsync = promisify(execFile);

export async function runComposeUp(
  workspaceRoot: string,
  composeFileRel: string
): Promise<{ ok: boolean; stderr: string }> {
  const composeCmd = getComposeCommand();
  const executable = composeCmd === "docker compose" ? "docker" : "docker-compose";
  const args =
    composeCmd === "docker compose"
      ? ["compose", "-f", composeFileRel, "up", "-d"]
      : ["-f", composeFileRel, "up", "-d"];

  try {
    await execFileAsync(executable, args, {
      cwd: workspaceRoot,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { ok: true, stderr: "" };
  } catch (err) {
    const stderr =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr?: string }).stderr ?? "")
        : err instanceof Error
          ? err.message
          : String(err);
    return { ok: false, stderr };
  }
}
