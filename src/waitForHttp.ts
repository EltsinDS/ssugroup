import * as http from "http";
import * as https from "https";

const POLL_INTERVAL_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHttpReady(statusCode: number | undefined): boolean {
  if (statusCode === undefined) return false;
  // nginx отдаёт 502, пока Next.js ещё не слушает upstream
  return statusCode > 0 && statusCode < 500;
}

function probeUrl(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const lib = parsed.protocol === "https:" ? https : http;

      const req = lib.get(
        url,
        {
          timeout: timeoutMs,
          headers: { Accept: "text/html" },
        },
        (res) => {
          res.resume();
          resolve(isHttpReady(res.statusCode));
        }
      );

      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

export async function waitForHttpUrls(
  urls: string[],
  timeoutMs: number,
  onProgress?: (message: string) => void
): Promise<{ ok: boolean; pending: string[] }> {
  if (urls.length === 0) {
    return { ok: true, pending: [] };
  }

  const deadline = Date.now() + timeoutMs;
  const uniqueUrls = [...new Set(urls)];

  while (Date.now() < deadline) {
    const checks = await Promise.all(
      uniqueUrls.map(async (url) => ({
        url,
        ready: await probeUrl(url, 5_000),
      }))
    );

    const pending = checks.filter((c) => !c.ready).map((c) => c.url);
    if (pending.length === 0) {
      return { ok: true, pending: [] };
    }

    onProgress?.(`Waiting for HTTP: ${pending.join(", ")}`);
    await sleep(POLL_INTERVAL_MS);
  }

  const finalChecks = await Promise.all(
    uniqueUrls.map(async (url) => ({
      url,
      ready: await probeUrl(url, 5_000),
    }))
  );
  const pending = finalChecks.filter((c) => !c.ready).map((c) => c.url);
  return { ok: pending.length === 0, pending };
}
