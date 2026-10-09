import path from "node:path";
import { DATA_DIR } from "./store.ts";
import { cacheImage } from "./imageCache.ts";

export const GIFTS_DIR = path.join(DATA_DIR, "gifts");

/**
 * Caches the artwork of a gift the hub told us about, so the broadcast can show
 * the real TikTok gift picture without ever loading it from the network.
 * Returns a local `/gifts/...` URL, or "" when it could not be cached.
 */
export async function cacheGiftArt(url: string): Promise<string> {
  return cacheImage(url, { dir: GIFTS_DIR, urlPath: "/gifts", maxBytes: 1024 * 1024, timeoutMs: 6000 });
}
