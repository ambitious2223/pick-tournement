import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Category } from "../shared/types.ts";
import { normalize } from "../engine/matcher.ts";

const DIR = new URL("../data/categories/", import.meta.url);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const files = readdirSync(fileURLToPath(DIR))
  .filter((name) => name.endsWith(".json"))
  .toSorted();

const categories = files.map((file) => ({
  file,
  data: JSON.parse(readFileSync(new URL(file, DIR), "utf8")) as Category,
}));

test("there are categories on disk", () => {
  assert.ok(categories.length >= 8, `only ${categories.length} categories`);
});

test("every category file parses and is well formed", () => {
  for (const { file, data } of categories) {
    const stem = file.replace(/\.json$/, "");
    assert.equal(data.id, stem, `${file}: id does not match its file name`);
    assert.match(data.id, SLUG, `${file}: id is not a slug`);
    assert.ok(data.name && data.name.trim(), `${file}: missing English name`);
    assert.ok(data.nameAr && data.nameAr.trim(), `${file}: missing Arabic name`);
    assert.ok(Array.isArray(data.giftPair) && data.giftPair.length === 2, `${file}: giftPair must hold two gifts`);
    for (const gift of data.giftPair ?? []) {
      assert.ok(gift.id && gift.name, `${file}: a gift in giftPair is missing id or name`);
    }
    assert.ok(data.items.length >= 1 && data.items.length <= 16, `${file}: ${data.items.length} items (1-16 allowed)`);
  }
});

test("every competitor has an id, a name and clean aliases", () => {
  for (const { file, data } of categories) {
    for (const item of data.items) {
      assert.match(item.id, SLUG, `${file}: "${item.name}" has a bad id "${item.id}"`);
      assert.ok(item.name && item.name.trim(), `${file}: an item has no name`);
      assert.ok(item.aliases && item.aliases.length > 0, `${file}: "${item.name}" has no aliases`);
      for (const alias of item.aliases) {
        assert.ok(alias.trim(), `${file}: "${item.name}" has a blank alias`);
        assert.ok(normalize(alias), `${file}: alias "${alias}" normalizes to nothing`);
      }
      assert.ok(normalize(item.name), `${file}: name "${item.name}" normalizes to nothing`);
      if (item.nameAr !== undefined) {
        assert.ok(item.nameAr.trim(), `${file}: "${item.name}" has a blank Arabic name`);
        assert.ok(normalize(item.nameAr), `${file}: Arabic name "${item.nameAr}" normalizes to nothing`);
      }
    }
  }
});

test("no two competitors in a category could be confused with each other", () => {
  for (const { file, data } of categories) {
    const ids = new Set<string>();
    const names = new Set<string>();
    for (const item of data.items) {
      assert.ok(!ids.has(item.id), `${file}: duplicate id ${item.id}`);
      ids.add(item.id);
      const key = normalize(item.name);
      assert.ok(!names.has(key), `${file}: duplicate name ${item.name}`);
      names.add(key);
      if (item.nameAr) {
        const arabicKey = normalize(item.nameAr);
        if (arabicKey && arabicKey !== key) {
          assert.ok(!names.has(arabicKey), `${file}: Arabic name "${item.nameAr}" collides with another competitor`);
          names.add(arabicKey);
        }
      }
      for (const alias of item.aliases) {
        const aliasKey = normalize(alias);
        if (aliasKey && aliasKey !== key) {
          assert.ok(!names.has(aliasKey), `${file}: "${alias}" for ${item.name} collides with another competitor`);
          names.add(aliasKey);
        }
      }
    }
  }
});

test("manual category order, when set, is a finite number and unique", () => {
  const seen = new Set<number>();
  for (const { file, data } of categories) {
    if (data.order === undefined) continue;
    assert.ok(Number.isFinite(data.order), `${file}: order is not a number`);
    assert.ok(!seen.has(data.order), `${file}: duplicate order ${data.order}`);
    seen.add(data.order);
  }
});

test("the play queue only references categories that exist", () => {
  const session = JSON.parse(readFileSync(new URL("../data/session.json", import.meta.url), "utf8")) as {
    queue?: { categoryId: string }[];
  };
  const known = new Set(categories.map((c) => c.data.id));
  for (const entry of session.queue ?? []) {
    assert.ok(known.has(entry.categoryId), `queue points at a deleted category: ${entry.categoryId}`);
  }
});
