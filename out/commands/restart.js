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
exports.restartCommand = restartCommand;
const vscode = __importStar(require("vscode"));
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
async function restartCommand() {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
    }
    const config = vscode.workspace.getConfiguration("projectComposeEnv");
    const services = config.get("restartServices")?.trim();
    const serviceArg = services ? ` ${services}` : "";
    const restartCmd = `${(0, compose_1.getComposeCommand)()} -f ${COMPOSE_FILE} restart${serviceArg}`;
    vscode.window.showInformationMessage(services
        ? `Restarting services: ${services}...`
        : "Restarting docker-compose services...");
    runInTerminal(workspaceRoot, restartCmd, "Project Restart");
}
//# sourceMappingURL=restart.js.map