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
 *  - Caps every download, times out every request, and logs every URL to data/photos.log.
 *  - Rejects non-free / fair-use images.
 *  - Runs on demand only (Tournament.bat first run, or npm run seed:photos). Never at app runtime.
 */

const ALLOWED_HOSTS = new Set([
  "en.wikipedia.org",
  "upload.wikimedia.org",
  "thumb.wikimedia.org",
  "commons.wikimedia.org",
]);
const USER_AGENT = "PickLeague/0.1 (local tournament overlay; contact: local user)";
const MAX_BYTES = 6 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15000;
const DELAY_MS = 200;

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
  await fs.appendFile(path.join(DATA_DIR, "photos.log"), `${new Date().toISOString()} ${message}\n`, "utf8");
}

function safeFetch(urlString: string): Promise<Response> {
  const url = new URL(urlString);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Blocked non-allowlisted host: ${url.hostname}`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json,image/*" },
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await safeFetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function isFreeUrl(url: string): boolean {
  return !url.includes("/wikipedia/en/") && !url.includes("/wikipedia/fairuse/");
}

interface Summary {
  type?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
}

async function summaryThumb(title: string): Promise<string | null> {
  const slug = encodeURIComponent(title.trim().replace(/\s+/g, "_"));
  const data = await fetchJson<Summary>(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`);
  if (!data || data.type === "disambiguation") return null;
  const thumb = data.thumbnail?.source;
  if (thumb) return thumb;
  const original = data.originalimage?.source;
  if (original && original.includes("/commons/")) return original;
  return null;
}

interface QueryPages {
  query?: { pages?: Record<string, { thumbnail?: { source?: string }; imageinfo?: { mime?: string; thumburl?: string }[] }> };
}

async function pageImage(title: string): Promise<string | null> {
  const data = await fetchJson<QueryPages>(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=400&titles=${encodeURIComponent(title)}`,
  );
  const pages = data?.query?.pages;
  if (!pages) return null;
  for (const key of Object.keys(pages)) {
    const src = pages[key]?.thumbnail?.source;
    if (src) return src;
  }
  return null;
}

interface SearchResult {
  query?: { search?: { title?: string }[] };
}

async function searchTitles(query: string): Promise<string[]> {
  const data = await fetchJson<SearchResult>(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=3&srsearch=${encodeURIComponent(query)}`,
  );
  const results = data?.query?.search ?? [];
  return results.map((r) => r.title).filter((t): t is string => Boolean(t));
}

async function commonsImage(query: string): Promise<string | null> {
  const data = await fetchJson<QueryPages>(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime&iiurlwidth=400&gsrsearch=${encodeURIComponent(query)}`,
  );
  const pages = data?.query?.pages;
  if (!pages) return null;
  for (const key of Object.keys(pages)) {
    const info = pages[key]?.imageinfo?.[0];
    if (info?.thumburl && /^image\/(jpeg|png|webp|gif)$/.test(info.mime ?? "")) return info.thumburl;
  }
  return null;
}

async function findImage(name: string, aliases: string[]): Promise<{ url: string; via: string } | null> {
  for (const candidate of [name, ...aliases].slice(0, 3)) {
    const url = await summaryThumb(candidate);
    if (url) return { url, via: "summary" };
  }
  for (const title of await searchTitles(name)) {
    const url = await pageImage(title);
    if (url) return { url, via: "search" };
  }
  const commons = await commonsImage(name);
  if (commons) return { url: commons, via: "commons" };
  return null;
}

async function downloadImage(url: string): Promise<string | null> {
  if (!isFreeUrl(url)) {
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
  const found = await findImage(item.name, item.aliases);
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
  console.log(`  + ${item.name} (${found.via})`);
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
    for (const item of items) {
      if (budget <= 0) break;
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
