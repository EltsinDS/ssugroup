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
exports.parseEnvToMap = parseEnvToMap;
exports.parseEnvToLines = parseEnvToLines;
exports.mergeEnv = mergeEnv;
exports.listPresets = listPresets;
exports.readPreset = readPreset;
exports.envDevelopmentPath = envDevelopmentPath;
exports.applyPresetToEnvDevelopment = applyPresetToEnvDevelopment;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ENV_LINE = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;
/**
 * Parse .env content into key-value map. Only lines matching KEY=VALUE are included.
 */
function parseEnvToMap(content) {
    const map = new Map();
    for (const line of content.split(/\r?\n/)) {
        const m = line.match(ENV_LINE);
        if (m) {
            const key = m[1];
            let value = m[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            map.set(key, value);
        }
    }
    return map;
}
/**
 * Parse .env into lines we can later reassemble, preserving comments and order.
 */
function parseEnvToLines(content) {
    const lines = [];
    for (const raw of content.split(/\r?\n/)) {
        const trimmed = raw.trim();
        if (trimmed === "") {
            lines.push({ type: "empty", raw });
            continue;
        }
        if (trimmed.startsWith("#")) {
            lines.push({ type: "comment", raw });
            continue;
        }
        const m = raw.match(ENV_LINE);
        if (m) {
            const key = m[1];
            let value = m[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            lines.push({ type: "keyvalue", key, value, raw });
        }
        else {
            lines.push({ type: "comment", raw });
        }
    }
    return lines;
}
/**
 * Merge preset key-values into base .env content. Returns new file content.
 * Base comments and order are preserved; only KEY=VALUE lines are overridden when key exists in preset.
 */
function mergeEnv(baseContent, presetContent) {
    const presetMap = parseEnvToMap(presetContent);
    const baseLines = parseEnvToLines(baseContent);
    const out = [];
    for (const line of baseLines) {
        if (line.type === "keyvalue" && presetMap.has(line.key)) {
            const newValue = presetMap.get(line.key);
            out.push(`${line.key}=${newValue}`);
        }
        else {
            out.push(line.raw);
        }
    }
    return out.join("\n");
}
/**
 * Read preset names from development/.env.presets/ (files ending with .env).
 * Returns array of preset names (filename without .env).
 */
function listPresets(workspaceRoot) {
    const presetsDir = path.join(workspaceRoot, "development", ".env.presets");
    if (!fs.existsSync(presetsDir) || !fs.statSync(presetsDir).isDirectory()) {
        return [];
    }
    return fs
        .readdirSync(presetsDir)
        .filter((f) => f.endsWith(".env"))
        .map((f) => f.replace(/\.env$/, ""))
        .sort();
}
/**
 * Read preset file content.
 */
function readPreset(workspaceRoot, presetName) {
    const filePath = path.join(workspaceRoot, "development", ".env.presets", `${presetName}.env`);
    return fs.readFileSync(filePath, "utf-8");
}
/**
 * Path to development/.env.development
 */
function envDevelopmentPath(workspaceRoot) {
    return path.join(workspaceRoot, "development", ".env.development");
}
/**
 * Apply preset to .env.development and write back.
 */
function applyPresetToEnvDevelopment(workspaceRoot, presetName) {
    const envPath = envDevelopmentPath(workspaceRoot);
    const baseContent = fs.readFileSync(envPath, "utf-8");
    const presetContent = readPreset(workspaceRoot, presetName);
    const merged = mergeEnv(baseContent, presetContent);
    fs.writeFileSync(envPath, merged, "utf-8");
}
//# sourceMappingURL=env.js.map