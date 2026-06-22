import * as fs from "fs";
import * as path from "path";

const ENV_LINE = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

/**
 * Parse .env content into key-value map. Only lines matching KEY=VALUE are included.
 */
export function parseEnvToMap(content: string): Map<string, string> {
  const map = new Map<string, string>();
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

export type EnvLine = { type: "keyvalue"; key: string; value: string; raw: string } | { type: "comment"; raw: string } | { type: "empty"; raw: string };

/**
 * Parse .env into lines we can later reassemble, preserving comments and order.
 */
export function parseEnvToLines(content: string): EnvLine[] {
  const lines: EnvLine[] = [];
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
    } else {
      lines.push({ type: "comment", raw });
    }
  }
  return lines;
}

/**
 * Merge preset key-values into base .env content. Returns new file content.
 * Base comments and order are preserved; only KEY=VALUE lines are overridden when key exists in preset.
 */
export function mergeEnv(baseContent: string, presetContent: string): string {
  const presetMap = parseEnvToMap(presetContent);
  const baseLines = parseEnvToLines(baseContent);
  const out: string[] = [];
  for (const line of baseLines) {
    if (line.type === "keyvalue" && presetMap.has(line.key)) {
      const newValue = presetMap.get(line.key)!;
      out.push(`${line.key}=${newValue}`);
    } else {
      out.push(line.raw);
    }
  }
  return out.join("\n");
}

/**
 * Read preset names from presets directory (files ending with .env).
 * Returns array of preset names (filename without .env).
 */
export function listPresets(presetsDir: string): string[] {
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
export function readPreset(presetsDir: string, presetName: string): string {
  const filePath = path.join(presetsDir, `${presetName}.env`);
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Apply preset to target env file and write back.
 * Only keys that exist in the target file are overwritten from the preset.
 */
export function applyPreset(envTargetFile: string, presetsDir: string, presetName: string): void {
  const baseContent = fs.readFileSync(envTargetFile, "utf-8");
  const presetContent = readPreset(presetsDir, presetName);
  const merged = mergeEnv(baseContent, presetContent);
  fs.writeFileSync(envTargetFile, merged, "utf-8");
}
