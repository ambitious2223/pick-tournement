import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureDirs } from "./store.ts";

const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export interface CacheImageOptions {
  dir: string;
  urlPath: string;
  maxBytes?: number;
  timeoutMs?: number;
}

const resolved = new Map<string, string>();

function hashOf(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 20);
}

/** Content-type headers are caller-supplied, so the bytes have to agree. */
function looksLikeImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  const head = buf.subarray(0, 4).toString("latin1");
  if (head === "GIF8" || head === "RIFF") return head === "RIFF" ? buf.subarray(8, 12).toString("latin1") === "WEBP" : true;
  return head.slice(1, 4) === "ftyp";
}

async function findCached(dir: string, urlPath: string, hash: string): Promise<string | null> {
  for (const ext of Object.values(TYPES)) {
    const file = path.join(dir, `${hash}${ext}`);
    try {
      await fs.access(file);
      return `${urlPath}/${hash}${ext}`;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

/**
 * Downloads one remote image, verifies the response really is an image, caps
 * the size and caches it under `dir` so the page is served locally. Returns the
 * local URL, or "" when the download failed or was not a usable image.
 *
 * One file, one hard size cap, never at render time — this is what keeps every
 * external fetch in the project down to a known, approved set.
 */
export async function cacheImage(url: string, opts: CacheImageOptions): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  const maxBytes = opts.maxBytes ?? 2 * 1024 * 1024;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const key = `${opts.dir}|${url}`;
  const known = resolved.get(key);
  if (known) return known;

  const hash = hashOf(url);
  const cached = await findCached(opts.dir, opts.urlPath, hash);
  if (cached) {
    resolved.set(key, cached);
    return cached;
  }

  await ensureDirs();
  await fs.mkdir(opts.dir, { recursive: true });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "PickLeague/1.0" } });
    clearTimeout(timer);
    if (!res.ok) return "";

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
    const ext = TYPES[contentType];
    if (!ext) return "";

    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared && declared > maxBytes) return "";

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > maxBytes) return "";
    if (!looksLikeImage(buf)) return "";

    const file = path.join(opts.dir, `${hash}${ext}`);
    await fs.writeFile(file, buf);
    const local = `${opts.urlPath}/${hash}${ext}`;
    resolved.set(key, local);
    return local;
  } catch {
    return "";
  }
}
