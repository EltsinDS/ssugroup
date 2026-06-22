"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = startCommand;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const env_1 = require("../env");
const config_1 = require("../config");
const composeExec_1 = require("../composeExec");
const waitForContainers_1 = require("../waitForContainers");
const compose_1 = require("../compose");
function getWorkspaceRoot() {
    const folder = vscode.workspace.workspaceFolders?.[0];
    return folder?.uri.fsPath;
}
function runInTerminal(workspaceRoot, command, name) {
    const terminal = vscode.window.createTerminal({
        cwd: workspaceRoot,
        name: name ?? "Project Composer",
    });
    terminal.show();
    terminal.sendText(command);
}
async function openBrowserUrls(urls) {
    for (const url of urls) {
        await vscode.env.openExternal(vscode.Uri.parse(url));
    }
}
async function startCommand() {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
    }
    const cfg = (0, config_1.getProjectComposeConfig)(workspaceRoot);
    if (!fs.existsSync(cfg.presetsDir) || !fs.statSync(cfg.presetsDir).isDirectory()) {
        vscode.window.showErrorMessage(`Presets folder not found: ${cfg.presetsPathRel}. Add preset files (e.g. demo.env) there.`);
        return;
    }
    const presets = (0, env_1.listPresets)(cfg.presetsDir);
    if (presets.length === 0) {
        vscode.window.showErrorMessage(`No .env preset files in ${cfg.presetsPathRel} (e.g. demo.env).`);
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
    if (selected === undefined)
        return;
    try {
        (0, env_1.applyPreset)(cfg.envTargetFile, cfg.presetsDir, selected);
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed to apply preset "${selected}": ${e instanceof Error ? e.message : String(e)}`);
        return;
    }
    const toRemove = [];
    if (cfg.cleanNextOnStart)
        toRemove.push(".next");
    if (cfg.cleanNodeModulesOnStart)
        toRemove.push("node_modules");
    if (cfg.cleanYarnLockOnStart)
        toRemove.push("yarn.lock");
    for (const rel of toRemove) {
        const full = path.join(workspaceRoot, rel);
        if (fs.existsSync(full)) {
            try {
                fs.rmSync(full, { recursive: true, force: true });
            }
            catch (err) {
                vscode.window.showWarningMessage(`Could not remove ${rel}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Project Composer: starting (${selected})`,
        cancellable: false,
    }, async (progress) => {
        progress.report({ message: "docker compose up -d..." });
        const upResult = await (0, composeExec_1.runComposeUp)(workspaceRoot, cfg.composeFileRel);
        if (!upResult.ok) {
            const composeCmd = `${(0, compose_1.getComposeCommand)()} -f ${cfg.composeFileRel} up -d`;
            runInTerminal(workspaceRoot, composeCmd);
            vscode.window.showErrorMessage(`docker compose up failed. See terminal for details.${upResult.stderr ? ` ${upResult.stderr.trim()}` : ""}`);
            return;
        }
        const shouldWait = cfg.waitForContainers.length > 0;
        if (shouldWait) {
            const waitResult = await (0, waitForContainers_1.waitForContainersRunning)(workspaceRoot, cfg.composeFileRel, cfg.waitForContainers, cfg.waitTimeoutMs, (message) => progress.report({ message }));
            if (!waitResult.ok) {
                vscode.window.showWarningMessage(`Timeout waiting for containers: ${waitResult.missing.join(", ")}. Stack is up; open URLs manually if needed.`);
            }
        }
        if (cfg.openBrowserOnStart) {
            if (cfg.openUrls.length === 0) {
                vscode.window.showWarningMessage("openBrowserOnStart is enabled but openUrls is empty. Add URLs in projectComposeEnv.openUrls.");
            }
            else {
                progress.report({ message: "Opening browser..." });
                await openBrowserUrls(cfg.openUrls);
            }
        }
        vscode.window.showInformationMessage(`Stand: ${selected}. Docker Compose is running.`);
    });
}
//# sourceMappingURL=start.js.map