import { readSettingRows, writeSettingRows } from "@/lib/data/inbox";
import { DEFAULT_SETTINGS } from "@/lib/constants";

export type SettingsMap = Record<string, string>;

let cache: { data: SettingsMap; at: number } | null = null;
const TTL_MS = 5_000;

/** All site settings merged over the defaults (defaults fill any missing key). */
export async function getSettings(force = false): Promise<SettingsMap> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.data;
  let stored: SettingsMap = {};
  try {
    stored = readSettingRows();
  } catch {
    stored = {};
  }
  const data = { ...DEFAULT_SETTINGS, ...stored };
  cache = { data, at: Date.now() };
  return data;
}

export async function getSetting(key: string): Promise<string> {
  const all = await getSettings();
  return all[key] ?? "";
}

export async function setSettings(values: SettingsMap) {
  writeSettingRows(values);
  cache = null;
}

export function invalidateSettingsCache() {
  cache = null;
}
