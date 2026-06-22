"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containerMatchesToken = containerMatchesToken;
exports.waitForContainersRunning = waitForContainersRunning;
const child_process_1 = require("child_process");
const util_1 = require("util");
const compose_1 = require("./compose");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const POLL_INTERVAL_MS = 2000;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function parseComposePs(stdout) {
    const rows = [];
    for (const line of stdout.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        try {
            rows.push(JSON.parse(trimmed));
        }
        catch {
            // skip malformed line
        }
    }
    return rows;
}
/** Match full name, suffix `-token`, or name ending with `token`. */
function containerMatchesToken(containerName, token) {
    if (containerName === token)
        return true;
    if (containerName.endsWith(`-${token}`))
        return true;
    if (containerName.endsWith(token))
        return true;
    return false;
}
function isRunning(state) {
    return (state ?? "").toLowerCase() === "running";
}
async function fetchRunningContainerNames(workspaceRoot, composeFileRel) {
    const composeCmd = (0, compose_1.getComposeCommand)();
    const executable = composeCmd === "docker compose" ? "docker" : "docker-compose";
    const args = composeCmd === "docker compose"
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
function findMissingTokens(runningNames, tokens) {
    return tokens.filter((token) => !runningNames.some((name) => containerMatchesToken(name, token)));
}
async function waitForContainersRunning(workspaceRoot, composeFileRel, tokens, timeoutMs, onProgress) {
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
        }
        catch {
            onProgress?.("Waiting for docker compose...");
        }
        await sleep(POLL_INTERVAL_MS);
    }
    try {
        const runningNames = await fetchRunningContainerNames(workspaceRoot, composeFileRel);
        const missing = findMissingTokens(runningNames, tokens);
        return { ok: missing.length === 0, missing };
    }
    catch {
        return { ok: false, missing: tokens };
    }
}
//# sourceMappingURL=waitForContainers.js.map