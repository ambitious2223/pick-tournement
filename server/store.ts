import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Category, SessionState } from "../shared/types.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "..");
export const DATA_DIR = path.join(ROOT, "data");
export const CATEGORIES_DIR = path.join(DATA_DIR, "categories");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const SOUNDS_DIR = path.join(DATA_DIR, "sounds");
export const SESSION_FILE = path.join(DATA_DIR, "session.json");
export const DIST_DIR = path.join(ROOT, "dist");

export async function ensureDirs(): Promise<void> {
  await fs.mkdir(CATEGORIES_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function loadCategories(): Promise<Category[]> {
  await ensureDirs();
  const entries = await fs.readdir(CATEGORIES_DIR);
  const categories: Category[] = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(CATEGORIES_DIR, name), "utf8");
      const parsed = JSON.parse(raw) as Category;
      if (parsed && typeof parsed.id === "string" && Array.isArray(parsed.items)) {
        categories.push(parsed);
      }
    } catch (error) {
      console.warn(`[store] skipping invalid category ${name}:`, (error as Error).message);
    }
  }
  return categories.toSorted((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
}

/** Persists a manual category order; ids not present keep their current file. */
export async function reorderCategories(ids: string[]): Promise<void> {
  const categories = await loadCategories();
  const byId = new Map(categories.map((c) => [c.id, c]));
  let position = 0;
  for (const id of ids) {
    const category = byId.get(id);
    if (!category) continue;
    category.order = position++;
    await saveCategory(category);
  }
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64) || "category";
}

export async function saveCategory(category: Category): Promise<void> {
  await ensureDirs();
  const file = path.join(CATEGORIES_DIR, `${safeId(category.id)}.json`);
  await fs.writeFile(file, `${JSON.stringify(category, null, 2)}\n`, "utf8");
}

export async function deleteCategory(id: string): Promise<void> {
  const file = path.join(CATEGORIES_DIR, `${safeId(id)}.json`);
  await fs.rm(file, { force: true });
}

export async function loadSession(): Promise<SessionState | null> {
  try {
    const raw = await fs.readFile(SESSION_FILE, "utf8");
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

let saveTimer: NodeJS.Timeout | null = null;
export function saveSessionDebounced(state: SessionState): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
        const { categories: _categories, matchHold: _hold, sideEffects: _side, ...persisted } = state;
    fs.writeFile(SESSION_FILE, `${JSON.stringify(persisted, null, 2)}\n`, "utf8").catch((error) => {
      console.warn("[store] failed to persist session:", (error as Error).message);
    });
  }, 400);
}

export async function countUploads(): Promise<number> {
  await ensureDirs();
  const entries = await fs.readdir(UPLOADS_DIR);
  return entries.filter((n) => !n.endsWith(".log")).length;
}

export async function clearUploads(): Promise<void> {
  await ensureDirs();
  const entries = await fs.readdir(UPLOADS_DIR);
  await Promise.all(entries.map((n) => fs.rm(path.join(UPLOADS_DIR, n), { force: true })));
}
