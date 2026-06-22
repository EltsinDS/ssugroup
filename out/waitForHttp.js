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
exports.waitForHttpUrls = waitForHttpUrls;
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const POLL_INTERVAL_MS = 2000;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isHttpReady(statusCode) {
    if (statusCode === undefined)
        return false;
    // nginx отдаёт 502, пока Next.js ещё не слушает upstream
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
async function waitForHttpUrls(urls, timeoutMs, onProgress) {
    if (urls.length === 0) {
        return { ok: true, pending: [] };
    }
    const deadline = Date.now() + timeoutMs;
    const uniqueUrls = [...new Set(urls)];
    while (Date.now() < deadline) {
        const checks = await Promise.all(uniqueUrls.map(async (url) => ({
            url,
            ready: await probeUrl(url, 5000),
        })));
        const pending = checks.filter((c) => !c.ready).map((c) => c.url);
        if (pending.length === 0) {
            return { ok: true, pending: [] };
        }
        onProgress?.(`Waiting for HTTP: ${pending.join(", ")}`);
        await sleep(POLL_INTERVAL_MS);
    }
    const finalChecks = await Promise.all(uniqueUrls.map(async (url) => ({
        url,
        ready: await probeUrl(url, 5000),
    })));
    const pending = finalChecks.filter((c) => !c.ready).map((c) => c.url);
    return { ok: pending.length === 0, pending };
}
//# sourceMappingURL=waitForHttp.js.map