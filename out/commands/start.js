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
const compose_1 = require("../compose");
const COMPOSE_FILE = "development/docker-compose.yml";
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
async function startCommand() {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
    }
    const presetsDir = path.join(workspaceRoot, "development", ".env.presets");
    const envPath = (0, env_1.envDevelopmentPath)(workspaceRoot);
    if (!fs.existsSync(presetsDir) || !fs.statSync(presetsDir).isDirectory()) {
        vscode.window.showErrorMessage("Folder development/.env.presets not found. Add preset files (e.g. demo.env) there.");
        return;
    }
    const presets = (0, env_1.listPresets)(workspaceRoot);
    if (presets.length === 0) {
        vscode.window.showErrorMessage("No .env preset files in development/.env.presets (e.g. demo.env).");
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
    if (selected === undefined)
        return;
    try {
        (0, env_1.applyPresetToEnvDevelopment)(workspaceRoot, selected);
    }
    catch (e) {
        vscode.window.showErrorMessage(`Failed to apply preset "${selected}": ${e instanceof Error ? e.message : String(e)}`);
        return;
    }
    const config = vscode.workspace.getConfiguration("projectComposeEnv");
    const cleanNext = config.get("cleanNextOnStart") ?? false;
    const cleanNodeModules = config.get("cleanNodeModulesOnStart") ?? false;
    const cleanYarnLock = config.get("cleanYarnLockOnStart") ?? false;
    const toRemove = [];
    if (cleanNext)
        toRemove.push(".next");
    if (cleanNodeModules)
        toRemove.push("node_modules");
    if (cleanYarnLock)
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
    vscode.window.showInformationMessage(`Stand: ${selected}. Starting docker-compose...`);
    const composeCmd = `${(0, compose_1.getComposeCommand)()} -f ${COMPOSE_FILE} up -d`;
    runInTerminal(workspaceRoot, composeCmd);
}
//# sourceMappingURL=start.js.map