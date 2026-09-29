import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Category, Item } from "../shared/types.ts";
import { loadCategories, saveCategory, UPLOADS_DIR, DATA_DIR, ensureDirs } from "../server/store.ts";

/**
 * Pick League photo fetcher.
 *
 * Safety contract (do not weaken):
 *  - Only talks to an explicit allowlist of Wikimedia hosts.
 *  - Only writes files whose response Content-Type is a real image type.
 *  - Caps every download and logs every URL to data/photos.log.
 *  - Runs on demand only (npm run seed:photos). Never at app runtime.
 */

const ALLOWED_HOSTS = new Set([
  "en.wikipedia.org",
  "upload.wikimedia.org",
  "thumb.wikimedia.org",
  "commons.wikimedia.org",
]);
const USER_AGENT = "PickLeague/0.1 (local tournament overlay; contact: local user)";
const MAX_BYTES = 6 * 1024 * 1024;
const DELAY_MS = 250;

const IMAGE_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

interface Options {
  category?: string;
  limit: number;
  force: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = { limit: 400, force: false };
  for (const arg of args) {
    if (arg.startsWith("--category=")) options.category = arg.slice("--category=".length);
    else if (arg.startsWith("--limit=")) options.limit = Number(arg.slice("--limit=".length)) || options.limit;
    else if (arg === "--force") options.force = true;
  }
  return options;
}

async function logUrl(message: string): Promise<void> {
  const line = `${new Date().toISOString()} ${message}\n`;
  await fs.appendFile(path.join(DATA_DIR, "photos.log"), line, "utf8");
}

function safeFetch(urlString: string): Promise<Response> {
  const url = new URL(urlString);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Blocked non-allowlisted host: ${url.hostname}`);
  }
  return fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json,image/*" } });
}

async function findThumbnail(name: string, aliases: string[]): Promise<{ url: string; title: string } | null> {
  const candidates = [name, ...aliases].slice(0, 3);
  for (const candidate of candidates) {
    const title = encodeURIComponent(candidate.trim().replace(/\s+/g, "_"));
    const res = await safeFetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
    if (!res.ok) continue;
    const data = (await res.json()) as {
      type?: string;
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };
    if (data.type === "disambiguation") continue;
    const thumb = data.thumbnail?.source;
    if (thumb) return { url: thumb, title: candidate };
    const original = data.originalimage?.source;
    if (original && original.includes("/commons/")) return { url: original, title: candidate };
  }
  return null;
}

async function downloadImage(url: string): Promise<string | null> {
  if (url.includes("/wikipedia/en/") || url.includes("/wikipedia/fairuse/")) {
    await logUrl(`REJECT ${url} (non-free / fair-use)`);
    return null;
  }
  const res = await safeFetch(url);
  if (!res.ok) return null;
  const contentType = (res.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
  const ext = IMAGE_EXT[contentType];
  if (!ext) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_BYTES) return null;
  const file = `${crypto.randomBytes(6).toString("hex")}${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, file), buffer);
  await logUrl(`OK ${url} -> uploads/${file} (${buffer.length} bytes)`);
  return `/uploads/${file}`;
}

async function processItem(item: Item, force: boolean): Promise<boolean> {
  if (item.image && !force) return false;
  const found = await findThumbnail(item.name, item.aliases);
  if (!found) {
    await logUrl(`SKIP ${item.name} (no free image)`);
    return false;
  }
  const local = await downloadImage(found.url);
  if (!local) {
    await logUrl(`FAIL ${item.name} ${found.url}`);
    return false;
  }
  item.image = local;
  console.log(`  + ${item.name} <- ${found.url}`);
  return true;
}

async function main(): Promise<void> {
  const options = parseArgs();
  await ensureDirs();
  const categories = await loadCategories();
  let budget = options.limit;
  let changed = 0;

  for (const category of categories) {
    if (options.category && category.id !== options.category) continue;
    if (budget <= 0) break;
    console.log(`\n[${category.name}]`);
    let dirty = false;
    const items: Item[] = [...category.items];
    for (let i = 0; i < items.length; i++) {
      if (budget <= 0) break;
      const item = items[i];
      if (!item) continue;
      try {
        if (await processItem(item, options.force)) {
          changed++;
          dirty = true;
          budget--;
        }
      } catch (error) {
        await logUrl(`ERROR ${item.name}: ${(error as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
    if (dirty) await saveCategory({ ...category, items } as Category);
  }

  console.log(`\nDone. ${changed} photo(s) downloaded. Log: data/photos.log`);
}

main().catch((error) => {
  console.error("[seed:photos] failed:", error);
  process.exit(1);
});
