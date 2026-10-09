import path from "node:path";
import { DATA_DIR } from "./store.ts";
import { cacheImage } from "./imageCache.ts";

export const AVATARS_DIR = path.join(DATA_DIR, "avatars");

/** Returns a local `/avatars/...` URL, or "" if the avatar could not be cached. */
export async function cacheAvatar(url: string): Promise<string> {
  return cacheImage(url, { dir: AVATARS_DIR, urlPath: "/avatars" });
}
