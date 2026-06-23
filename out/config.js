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
exports.getProjectComposeConfig = getProjectComposeConfig;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
function getProjectComposeConfig(workspaceRoot) {
    const config = vscode.workspace.getConfiguration("projectComposeEnv");
    const presetsPathRel = config.get("presetsPath") ?? "development/.env.presets";
    const envTargetFileRel = config.get("envTargetFile") ?? "development/.env.development";
    const composeFileRel = config.get("composeFile") ?? "development/docker-compose.yml";
    const waitRaw = config.get("waitForContainers")?.trim() ?? "";
    const waitForContainers = waitRaw ? waitRaw.split(/\s+/).filter(Boolean) : [];
    const warmupHttpOnStart = config.get("warmupHttpOnStart") ??
        config.get("waitForHttpOnStart") ??
        true;
    return {
        presetsDir: path.join(workspaceRoot, presetsPathRel),
        presetsPathRel,
        envTargetFile: path.join(workspaceRoot, envTargetFileRel),
        envTargetFileRel,
        composeFile: path.join(workspaceRoot, composeFileRel),
        composeFileRel,
        cleanNextOnStart: config.get("cleanNextOnStart") ?? false,
        cleanNodeModulesOnStart: config.get("cleanNodeModulesOnStart") ?? false,
        cleanYarnLockOnStart: config.get("cleanYarnLockOnStart") ?? false,
        openBrowserOnStart: config.get("openBrowserOnStart") ?? false,
        openUrls: config.get("openUrls") ?? [],
        waitForContainers,
        waitTimeoutMs: config.get("waitTimeoutMs") ?? 300000,
        warmupHttpOnStart,
        warmupUrl: config.get("warmupUrl")?.trim() ?? "",
        warmupRequestTimeoutMs: config.get("warmupRequestTimeoutMs") ?? 120000,
        secondaryUrlsDelayMs: config.get("secondaryUrlsDelayMs") ?? 5000,
        showComposeOutputInTerminal: config.get("showComposeOutputInTerminal") ?? true,
    };
}
//# sourceMappingURL=config.js.map