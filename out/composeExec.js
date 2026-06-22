"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runComposeUp = runComposeUp;
const child_process_1 = require("child_process");
const util_1 = require("util");
const compose_1 = require("./compose");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
async function runComposeUp(workspaceRoot, composeFileRel) {
    const composeCmd = (0, compose_1.getComposeCommand)();
    const executable = composeCmd === "docker compose" ? "docker" : "docker-compose";
    const args = composeCmd === "docker compose"
        ? ["compose", "-f", composeFileRel, "up", "-d"]
        : ["-f", composeFileRel, "up", "-d"];
    try {
        await execFileAsync(executable, args, {
            cwd: workspaceRoot,
            maxBuffer: 10 * 1024 * 1024,
        });
        return { ok: true, stderr: "" };
    }
    catch (err) {
        const stderr = err && typeof err === "object" && "stderr" in err
            ? String(err.stderr ?? "")
            : err instanceof Error
                ? err.message
                : String(err);
        return { ok: false, stderr };
    }
}
//# sourceMappingURL=composeExec.js.map