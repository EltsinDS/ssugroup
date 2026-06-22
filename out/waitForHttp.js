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
exports.warmUpHttpUrl = warmUpHttpUrl;
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const RETRY_INTERVAL_MS = 2000;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isHttpReady(statusCode) {
    if (statusCode === undefined)
        return false;
    return statusCode > 0 && statusCode < 500;
}
function probeUrl(url, timeoutMs) {
    return new Promise((resolve) => {
        try {
            const parsed = new URL(url);
            const lib = parsed.protocol === "https:" ? https : http;
            const req = lib.get(url, {
                timeout: timeoutMs,
                headers: { Accept: "text/html" },
            }, (res) => {
                res.resume();
                resolve(isHttpReady(res.statusCode));
            });
            req.on("error", () => resolve(false));
            req.on("timeout", () => {
                req.destroy();
                resolve(false);
            });
        }
        catch {
            resolve(false);
        }
    });
}
/**
 * Долгий warm-up одного URL: повторяет GET с большим timeout, пока Next.js не ответит < 500.
 * Один запрос может ждать компиляцию; между попытками — короткая пауза.
 */
async function warmUpHttpUrl(url, totalTimeoutMs, perRequestTimeoutMs, onProgress) {
    const deadline = Date.now() + totalTimeoutMs;
    while (Date.now() < deadline) {
        onProgress?.(`Warming up ${url}...`);
        const ready = await probeUrl(url, perRequestTimeoutMs);
        if (ready) {
            return true;
        }
        if (Date.now() + RETRY_INTERVAL_MS >= deadline) {
            break;
        }
        await sleep(RETRY_INTERVAL_MS);
    }
    return false;
}
//# sourceMappingURL=waitForHttp.js.map