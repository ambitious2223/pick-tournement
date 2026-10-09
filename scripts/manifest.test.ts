import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildManifest } from "./manifest.ts";
import { HANDLED_EFFECT_KEYS, isHandledEffect } from "../shared/config.ts";

const file = new URL("../tikora.manifest.json", import.meta.url);
const onDisk = JSON.parse(readFileSync(file, "utf8")) as ReturnType<typeof buildManifest>;
const keys = onDisk.effects.map((e) => e.key);

test("tikora.manifest.json matches what buildManifest() generates", () => {
  assert.deepEqual(onDisk, buildManifest());
});

test("manifest obeys the hub's parser limits and has unique keys", () => {
  assert.equal(onDisk.slug, "pick-league");
  assert.ok(onDisk.effects.length <= 200, "too many effects for the hub");
  assert.ok(onDisk.events.length <= 50, "too many events for the hub");
  assert.equal(new Set(keys).size, keys.length, "duplicate effect keys");

  for (const effect of onDisk.effects) {
    assert.ok(effect.key.length <= 80, `effect key too long: ${effect.key}`);
    assert.ok(effect.label !== undefined && effect.label.length <= 80, `bad label: ${effect.key}`);
    assert.ok(effect.kind === undefined || effect.kind.length <= 40, `bad kind: ${effect.key}`);
    assert.ok((effect.params ?? []).length <= 20, `too many params: ${effect.key}`);
    for (const param of effect.params ?? []) {
      assert.ok(param.key.length > 0 && param.key.length <= 40, `bad param key: ${effect.key}.${param.key}`);
      assert.ok(param.label === undefined || param.label.length <= 60, `bad param label: ${param.key}`);
      assert.ok(param.type === undefined || param.type.length <= 20, `bad param type: ${param.key}`);
    }
  }
  for (const event of onDisk.events) {
    assert.ok(event.key.length <= 40, `event key too long: ${event.key}`);
    assert.ok(event.label === undefined || event.label.length <= 60, `bad event label: ${event.key}`);
  }
});

const NON_GAMEPLAY =
  /^(cue\.|track\.|music_|show_|match_|force_|view_|sim_|demo_|session_|queue_|next_|tournament_|set_round)/;

test("declares gameplay power-ups only — no sound, music, cosmetic or host controls", () => {
  for (const key of keys) {
    assert.ok(!NON_GAMEPLAY.test(key), `non-gameplay effect declared: ${key}`);
    assert.ok(key !== "shoutout" && key !== "confetti", `cosmetic effect declared: ${key}`);
  }
  for (const effect of onDisk.effects) {
    assert.equal(effect.kind, "powerup", `expected kind "powerup": ${effect.key}`);
  }
});

test("every declared effect has a handler, and every handler is declared", () => {
  assert.deepEqual(keys.toSorted(), [...HANDLED_EFFECT_KEYS].toSorted());
  for (const key of keys) {
    assert.ok(isHandledEffect(key), `manifest declares "${key}" but session.ts has no handler for it`);
  }
  assert.ok(keys.length >= 10, `expected at least 10 effects, got ${keys.length}`);
});

test("amount params use the vote presets, never Tikora's number input", () => {
  for (const key of ["add_vote", "steal_votes", "set_side_gift"]) {
    const effect = onDisk.effects.find((e) => e.key === key);
    const amount = effect?.params?.find((p) => p.key === "amount");
    assert.ok(amount, `${key} should expose an amount param`);
    assert.equal(amount.type, "votes", `${key}.amount should offer the vote presets`);
  }
});

test("only param types the hub knows how to render", () => {
  const known = new Set(["string", "number", "side", "secs", "mult", "votes", "gift", "lane", "target", "team", "card"]);
  for (const effect of onDisk.effects) {
    for (const param of effect.params ?? []) {
      assert.ok(param.type && known.has(param.type), `${effect.key}.${param.key}: unknown type "${param.type}"`);
    }
  }
});

test("no param uses Tikora's number branch — it would null out {coins}", () => {
  for (const effect of onDisk.effects) {
    for (const param of effect.params ?? []) {
      assert.notEqual(
        param.type,
        "number",
        `${effect.key}.${param.key}: use a preset type (secs/mult/votes), not "number"`,
      );
    }
  }
});
