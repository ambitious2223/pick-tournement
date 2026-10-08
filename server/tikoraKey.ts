import { existsSync } from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSync } from "node:sqlite";

/** This game's slug, as Tikora's Game Hub knows it. */
export const HUB_SLUG = "pick-league";

/** The folder Tikora scans for tikora.manifest.json — this project. */
export function projectRoot(): string {
  return fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]+$/, "");
}

function tikoraDbPath(): string {
  const roaming = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
  return path.join(roaming, "tikora", "tikora.db");
}

/**
 * The game key Tikora expects, read straight from Tikora's own local database
 * so nobody ever copies and pastes one.
 *
 * If Pick League has never been registered (a fresh machine), it registers it
 * here: one `games` row pointed at this folder — so Tikora finds the manifest —
 * and one `game_integrations` key. Both writes are idempotent.
 *
 * Returns null when Tikora has never run on this machine.
 */
export async function findOrRegisterKey(slug = HUB_SLUG): Promise<string | null> {
  const file = tikoraDbPath();
  if (!existsSync(file)) return null;

  let db: DatabaseSync | null = null;
  try {
    const { DatabaseSync: Db } = await import("node:sqlite");
    db = new Db(file, { timeout: 2000 });

    const game = db.prepare("SELECT path FROM games WHERE slug = ?").get(slug) as
      | { path?: string | null }
      | undefined;
    if (!game) {
      db.prepare(
        "INSERT INTO games (name, slug, path, type, icon, description, installed, price, port, modded, bat_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        "Pick League",
        slug,
        projectRoot(),
        "webapp",
        "🏆",
        "Single-elimination bracket voting show for TikTok Live (Arabic-first).",
        1,
        0,
        8787,
        0,
        path.join(projectRoot(), "Tournament.bat"),
      );
      console.log("[live] registered Pick League in Tikora's Game Hub");
    } else if (!game.path) {
      db.prepare("UPDATE games SET path = ? WHERE slug = ?").run(projectRoot(), slug);
    }

    const integration = db.prepare("SELECT api_key FROM game_integrations WHERE game_slug = ?").get(slug) as
      | { api_key?: string }
      | undefined;
    if (integration?.api_key) return integration.api_key;

    const key = `gk_${crypto.randomBytes(24).toString("base64url")}`;
    db.prepare("INSERT INTO game_integrations (game_slug, api_key, enabled) VALUES (?, ?, 1)").run(slug, key);
    console.log("[live] generated a game key in Tikora's Game Hub");
    return key;
  } catch (error) {
    console.warn(`[live] could not read Tikora's database: ${(error as Error).message}`);
    return null;
  } finally {
    try {
      db?.close();
    } catch {
      /* already closed */
    }
  }
}
