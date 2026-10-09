import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Category, Item } from "../shared/types.ts";
import { loadCategories, saveCategory, UPLOADS_DIR, DATA_DIR, ensureDirs } from "./store.ts";

/**
 * Pick League photo fetcher.
 *
 * Safety contract (do not weaken):
 *  - Only talks to an explicit allowlist of Wikimedia hosts.
 *  - Only writes files whose response Content-Type is a real image type.
 *  - Caps every download, times out every request, and logs every URL to data/photos.log.
 *  - Rejects non-free / fair-use images.
 *  - Runs on demand only (Tournament.bat first run, the Studio button, or npm run seed:photos).
 */

const ALLOWED_HOSTS = new Set([
  "en.wikipedia.org",
  "ar.wikipedia.org",
  "upload.wikimedia.org",
  "thumb.wikimedia.org",
  "commons.wikimedia.org",
]);
const USER_AGENT = "PickLeague/0.1 (local tournament overlay; contact: local user)";
const MAX_BYTES = 6 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15000;
const DELAY_MS = 300;

const IMAGE_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export interface FetchOptions {
  category?: string;
  limit?: number;
  force?: boolean;
  log?: (line: string) => void;
}

export interface FetchSummary {
  changed: number;
  skipped: number;
  attempted: number;
  coverage: { id: string; name: string; have: number; total: number }[];
}

async function logUrl(message: string): Promise<void> {
  await fs.appendFile(path.join(DATA_DIR, "photos.log"), `${new Date().toISOString()} ${message}\n`, "utf8");
}

async function safeFetch(urlString: string, attempt = 0): Promise<Response> {
  const url = new URL(urlString);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Blocked non-allowlisted host: ${url.hostname}`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json,image/*" },
      signal: controller.signal,
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      return safeFetch(urlString, attempt + 1);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
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

async function summaryThumb(lang: string, title: string): Promise<string | null> {
  const slug = encodeURIComponent(title.trim().replace(/\s+/g, "_"));
  const data = await fetchJson<Summary>(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`);
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

async function pageImage(lang: string, title: string): Promise<string | null> {
  const data = await fetchJson<QueryPages>(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=400&titles=${encodeURIComponent(title)}`,
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

async function searchTitles(lang: string, query: string): Promise<string[]> {
  const data = await fetchJson<SearchResult>(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=3&srsearch=${encodeURIComponent(query)}`,
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
  const candidates = [name, ...aliases].slice(0, 4);
  // Fair-use hits are skipped rather than accepted, so discovery keeps going
  // and can still land on a free image in Arabic Wikipedia or Commons.
  for (const lang of ["en", "ar"]) {
    for (const candidate of candidates) {
      const url = await summaryThumb(lang, candidate);
      if (url && isFreeUrl(url)) return { url, via: `${lang}-summary` };
    }
  }
  for (const lang of ["en", "ar"]) {
    for (const title of await searchTitles(lang, name)) {
      const url = await pageImage(lang, title);
      if (url && isFreeUrl(url)) return { url, via: `${lang}-search` };
    }
  }
  for (const query of [name, ...aliases.slice(0, 2)]) {
    const url = await commonsImage(query);
    if (url && isFreeUrl(url)) return { url, via: "commons" };
  }
  return null;
}

async function downloadImage(url: string, label: string): Promise<string | null> {
  if (!isFreeUrl(url)) {
    await logUrl(`REJECT ${url} (non-free / fair-use)`);
    return null;
  }
  const res = await safeFetch(url);
  if (!res.ok) {
    await logUrl(`FAIL ${label} HTTP ${res.status} ${url}`);
    return null;
  }

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
  const ext = IMAGE_EXT[contentType];
  if (!ext) {
    await logUrl(`FAIL ${label} not an image (${contentType || "no content-type"}) ${url}`);
    return null;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    await logUrl(`FAIL ${label} empty or oversized (${buffer.length} bytes) ${url}`);
    return null;
  }
  const file = `${crypto.randomBytes(6).toString("hex")}${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, file), buffer);
  await logUrl(`OK ${url} -> uploads/${file} (${buffer.length} bytes)`);
  return `/uploads/${file}`;
}
async function processItem(item: Item, force: boolean, log: (line: string) => void): Promise<boolean> {
  if (item.image && !force) return false;
  const found = await findImage(item.name, item.aliases);
  if (!found) {
    await logUrl(`SKIP ${item.name} (no free image)`);
    return false;
  }
  const local = await downloadImage(found.url, item.name);
  if (!local) {
    await logUrl(`FAIL ${item.name} ${found.url}`);
    return false;
  }
  item.image = local;
  log(`  + ${item.name} (${found.via})`);
  return true;
}

export async function photoCoverage(): Promise<FetchSummary["coverage"]> {
  const categories = await loadCategories();
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    have: c.items.filter((i) => i.image).length,
    total: c.items.length,
  }));
}

export async function fetchPhotos(options: FetchOptions = {}): Promise<FetchSummary> {
  await ensureDirs();
  const log = options.log ?? ((line: string) => console.log(line));
  const limit = options.limit ?? 400;
  const force = options.force ?? false;
  const categories = await loadCategories();

  let budget = limit;
  let changed = 0;
  let skipped = 0;
  let attempted = 0;

  for (const category of categories) {
    if (options.category && category.id !== options.category) continue;
    if (budget <= 0) break;
    log(`\n[${category.name}]`);
    let dirty = false;
    const items: Item[] = [...category.items];
    for (const item of items) {
      if (budget <= 0) break;
      attempted++;
      try {
        if (await processItem(item, force, log)) {
          changed++;
          dirty = true;
          budget--;
        } else {
          skipped++;
        }
      } catch (error) {
        await logUrl(`ERROR ${item.name}: ${(error as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
    if (dirty) await saveCategory({ ...category, items } as Category);
  }

  return { changed, skipped, attempted, coverage: await photoCoverage() };
}
