import { mkdtempSync, rmSync, mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { findOrRegisterKey, projectRoot } from "../server/tikoraKey.ts";
import { resolveLiveConfig } from "../server/liveConfig.ts";

const results: { what: string; ok: boolean; note: string }[] = [];
const check = (what: string, ok: boolean, note = ""): void => {
  results.push({ what, ok, note });
};

const realAppData = process.env.APPDATA;
const sandbox = mkdtempSync(path.join(tmpdir(), "pl-key-"));
const tikoraDir = path.join(sandbox, "tikora");
const dbFile = path.join(tikoraDir, "tikora.db");

async function openFixture(): Promise<import("node:sqlite").DatabaseSync> {
  mkdirSync(tikoraDir, { recursive: true });
  const mod = await import("node:sqlite");
  const db = new mod.DatabaseSync(dbFile);
  db.exec(
    "CREATE TABLE games (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, slug TEXT, path TEXT, type TEXT, icon TEXT, description TEXT, installed INTEGER, price INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, port INTEGER, modded INTEGER, bat_path TEXT)",
  );
  db.exec(
    "CREATE TABLE game_integrations (game_slug TEXT PRIMARY KEY, api_key TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, protocol INTEGER NOT NULL DEFAULT 2, status TEXT NOT NULL DEFAULT 'offline', last_seen TEXT, capabilities TEXT)",
  );
  return db;
}

// --- a machine where Tikora has never run -----------------------------------
process.env.APPDATA = sandbox;
rmSync(dbFile, { force: true });
check("no Tikora install â†’ no key", (await findOrRegisterKey()) === null, "db missing");

// --- a machine where Pick League was never registered ------------------------
const db = await openFixture();
const first = await findOrRegisterKey();
check("registers and returns a key", typeof first === "string" && first.startsWith("gk_"), String(first));
check("key length looks like Tikora's", (first ?? "").length > 30, `len=${(first ?? "").length}`);

const second = await findOrRegisterKey();
check("second call returns the same key", second === first, `${second} vs ${first}`);

const game = db.prepare("SELECT name, slug, path, port, bat_path FROM games WHERE slug = ?").get("pick-league") as
  | { name: string; slug: string; path: string; port: number; bat_path: string }
  | undefined;
check("game row created", Boolean(game), JSON.stringify(game ?? null));
check("manifest folder recorded", game?.path === projectRoot(), `${game?.path} vs ${projectRoot()}`);
check("port recorded", game?.port === 8787, String(game?.port));
check("bat recorded", game?.bat_path?.endsWith("Tournament.bat") ?? false, String(game?.bat_path));
check("manifest file really lives there", existsSync(path.join(projectRoot(), "tikora.manifest.json")), projectRoot());

const integration = db.prepare("SELECT api_key, enabled, status FROM game_integrations WHERE game_slug = ?").get(
  "pick-league",
) as { api_key: string; enabled: number; status: string } | undefined;
check("integration row created", Boolean(integration), JSON.stringify(integration ?? null));
check("integration enabled", integration?.enabled === 1, String(integration?.enabled));
db.close();

// --- a machine where someone added the game by hand but left the path empty ---
rmSync(dbFile, { force: true });
const db2 = await openFixture();
db2.prepare("INSERT INTO games (name, slug, path, port) VALUES (?, ?, NULL, ?)").run(
  "Pick League",
  "pick-league",
  8787,
);
const withPath = await findOrRegisterKey();
const filled = db2.prepare("SELECT path FROM games WHERE slug = ?").get("pick-league") as { path: string };
check("fills in a missing manifest folder", filled.path === projectRoot(), filled.path);
check("still returns a key", Boolean(withPath), String(withPath));
db2.close();

// --- key handed to us by Tikora when it launches the game --------------------
process.env.TIKORA_GAME_KEY = "gk_from_environment";
process.env.TIKORA_GAME_SLUG = "pick-league";
process.env.TIKORA_RELAY_URL = "ws://127.0.0.1:27016/";
const envResolved = await resolveLiveConfig();
check("environment key wins", envResolved.config.key === "gk_from_environment", envResolved.config.key);
check("marks config as changed", envResolved.changed, String(envResolved.changed));
delete process.env.TIKORA_GAME_KEY;
delete process.env.TIKORA_GAME_SLUG;
delete process.env.TIKORA_RELAY_URL;

// --- saved key is reused as-is ----------------------------------------------
process.env.APPDATA = realAppData;
const liveFile = path.join(projectRoot(), "data", "live.json");
const savedRaw = existsSync(liveFile) ? readFileSync(liveFile, "utf8") : null;
writeFileSync(
  liveFile,
  `${JSON.stringify({ url: "ws://127.0.0.1:27016/", slug: "pick-league", key: "gk_saved_one" }, null, 2)}\n`,
  "utf8",
);
try {
  const savedResolved = await resolveLiveConfig();
  check("saved key reused", savedResolved.config.key === "gk_saved_one", savedResolved.config.key);
  check("saved key counts as unchanged", !savedResolved.changed, String(savedResolved.changed));
} finally {
  if (savedRaw !== null) writeFileSync(liveFile, savedRaw, "utf8");
  else rmSync(liveFile, { force: true });
  if (realAppData) process.env.APPDATA = realAppData;
  rmSync(sandbox, { recursive: true, force: true });
}

let failed = 0;
for (const row of results) {
  if (!row.ok) failed += 1;
  console.log(`${row.ok ? "PASS" : "FAIL"}  ${row.what}${row.note ? `  (${row.note})` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
