import * as http from "http";
import * as https from "https";

const RETRY_INTERVAL_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHttpReady(statusCode: number | undefined): boolean {
  if (statusCode === undefined) return false;
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

/**
 * Долгий warm-up одного URL: повторяет GET с большим timeout, пока Next.js не ответит < 500.
 * Один запрос может ждать компиляцию; между попытками — короткая пауза.
 */
export async function warmUpHttpUrl(
  url: string,
  totalTimeoutMs: number,
  perRequestTimeoutMs: number,
  onProgress?: (message: string) => void
): Promise<boolean> {
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
