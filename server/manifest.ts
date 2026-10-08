import { readFileSync } from "node:fs";
import type { GameManifest, ManifestEffect, ManifestEvent } from "../shared/types.ts";

/**
 * Loads tikora.manifest.json — the single source of truth for the effects Pick
 * League advertises to the Tikora hub. The same file is read by the hub itself
 * straight from this folder, so the game and the hub can never drift apart.
 */
const FALLBACK: GameManifest = {
  slug: "pick-league",
  effects: [{ key: "show_start", label: "Show start" }],
  events: [{ key: "chat", label: "Chat comment" }, { key: "gift", label: "Gift" }],
};

let cached: GameManifest | null = null;

function usable<T>(list: unknown): T[] {
  if (!Array.isArray(list)) return [];
  const out: T[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const key = (entry as { key?: unknown }).key;
    if (typeof key !== "string" || !key.trim()) continue;
    out.push(entry as T);
  }
  return out;
}

export function loadManifest(): GameManifest {
  if (cached) return cached;
  try {
    const url = new URL("../tikora.manifest.json", import.meta.url);
    const parsed = JSON.parse(readFileSync(url, "utf8")) as Partial<GameManifest>;
    const effects = usable<ManifestEffect>(parsed?.effects);
    if (effects.length === 0) throw new Error("no usable effects");
    const manifest: GameManifest = {
      slug: typeof parsed?.slug === "string" && parsed.slug ? parsed.slug : "pick-league",
      effects,
      events: usable<ManifestEvent>(parsed?.events),
    };
    cached = manifest;
    return manifest;
  } catch (error) {
    console.warn(`[live] tikora.manifest.json unavailable (${(error as Error).message}) — using fallback list`);
    cached = FALLBACK;
    return cached;
  }
}
