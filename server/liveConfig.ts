import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_DIR, ensureDirs } from "./store.ts";

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
