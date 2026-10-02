import fs from "node:fs";
import path from "node:path";

/**
 * Tiny .env loader for the standalone scripts (the Next.js app loads .env by
 * itself; scripts run outside it). Existing environment variables always win.
 */
export function loadEnvFile(file = ".env") {
  const full = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  for (const rawLine of fs.readFileSync(full, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
