import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_DIR, ensureDirs } from "./store.ts";

/**
 * The one approved external fetch path besides scripts/fetch-photos.ts.
 * It downloads a single viewer avatar from a TikTok CDN URL, verifies it is a
 * real image, caps the size, caches it under data/avatars/ (gitignored) and
 * serves it locally so the overlay never makes external calls.
 */
export const AVATARS_DIR = path.join(DATA_DIR, "avatars");

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const resolved = new Map<string, string>();

function hashOf(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 20);
}

async function findCached(hash: string): Promise<string | null> {
  for (const ext of Object.values(TYPES)) {
    const file = path.join(AVATARS_DIR, `${hash}${ext}`);
    try {
      await fs.access(file);
      return `/avatars/${hash}${ext}`;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

/** Returns a local `/avatars/...` URL, or "" if the avatar could not be cached. */
export async function cacheAvatar(url: string): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  const known = resolved.get(url);
  if (known) return known;

  const hash = hashOf(url);
  const cached = await findCached(hash);
  if (cached) {
    resolved.set(url, cached);
    return cached;
  }

  await ensureDirs();
  await fs.mkdir(AVATARS_DIR, { recursive: true });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "PickLeague/1.0" } });
    clearTimeout(timer);
    if (!res.ok) return "";

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
    const ext = TYPES[contentType];
    if (!ext) return "";

    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared && declared > MAX_BYTES) return "";

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_BYTES) return "";

    const file = path.join(AVATARS_DIR, `${hash}${ext}`);
    await fs.writeFile(file, buf);
    const local = `/avatars/${hash}${ext}`;
    resolved.set(url, local);
    return local;
  } catch {
    return "";
  }
}
