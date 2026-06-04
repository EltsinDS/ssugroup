import { execSync } from "child_process";

let cached: string | undefined;

export function getComposeCommand(): string {
  if (cached) return cached;
  try {
    execSync("docker compose version", { stdio: "ignore" });
    cached = "docker compose";
  } catch {
    cached = "docker-compose";
  }
  return cached;
}
