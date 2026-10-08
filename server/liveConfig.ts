import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_DIR, ensureDirs } from "./store.ts";
import { findOrRegisterKey } from "./tikoraKey.ts";

export interface LiveConfig {
  url: string;
  slug: string;
  key: string;
}

const FILE = path.join(DATA_DIR, "live.json");

const DEFAULTS: LiveConfig = {
  url: "ws://127.0.0.1:27016/",
  slug: "pick-league",
  key: "",
};

export async function loadLiveConfig(): Promise<LiveConfig> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LiveConfig>;
    return {
      url: typeof parsed.url === "string" && parsed.url ? parsed.url : DEFAULTS.url,
      slug: typeof parsed.slug === "string" ? parsed.slug : DEFAULTS.slug,
      key: typeof parsed.key === "string" ? parsed.key : DEFAULTS.key,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveLiveConfig(config: LiveConfig): Promise<void> {
  await ensureDirs();
  await fs.writeFile(FILE, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

/**
 * Work out where to connect and with which key, without anyone typing one.
 *
 * Order: the environment Tikora injects when it launches the game → whatever we
 * already saved → Tikora's own database (registering the game if needed).
 */
export async function resolveLiveConfig(): Promise<{ config: LiveConfig; changed: boolean }> {
  const saved = await loadLiveConfig();
  const envKey = (process.env.TIKORA_GAME_KEY ?? "").trim();
  const envSlug = (process.env.TIKORA_GAME_SLUG ?? "").trim();
  const envUrl = (process.env.TIKORA_RELAY_URL ?? "").trim();

  const config: LiveConfig = {
    url: envUrl || saved.url,
    slug: envSlug || saved.slug,
    key: envKey || saved.key,
  };
  if (!config.key) config.key = (await findOrRegisterKey(config.slug)) ?? "";

  const changed = config.key !== saved.key || config.slug !== saved.slug || config.url !== saved.url;
  return { config, changed };
}
