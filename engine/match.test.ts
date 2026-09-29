import { test } from "node:test";
import assert from "node:assert/strict";
import type { Item, Match, Settings } from "../shared/types.ts";
import { DEFAULT_SETTINGS } from "../shared/config.ts";
import { matchItem, normalize } from "./matcher.ts";
import { castChatVote, castGiftVote, resolveWinner } from "./match.ts";

function liveMatch(): Match {
  return {
    id: "r16:0",
    round: "r16",
    index: 0,
    a: "ronaldo",
    b: "messi",
    votesA: 0,
    votesB: 0,
    votersA: [],
    votersB: [],
    winner: null,
    status: "live",
    endsAt: null,
  };
}

const items: (Item | null)[] = [
  { id: "ronaldo", name: "Cristiano Ronaldo", aliases: ["cr7", "ronaldo"] },
  { id: "messi", name: "Lionel Messi", aliases: ["leo", "messi"] },
];

test("normalizes accents, case and punctuation", () => {
  assert.equal(normalize("  Cristiano  RONALDO! "), "cristiano ronaldo");
  assert.equal(normalize("Zinédine Zidane"), "zinedine zidane");
});

test("matches by name and by alias, and ignores unknown text", () => {
  assert.equal(matchItem("ronaldo", items), "ronaldo");
  assert.equal(matchItem("CR7", items), "ronaldo");
  assert.equal(matchItem("i vote messi", items), "messi");
  assert.equal(matchItem("hello chat", items), null);
});

test("chat votes are deduped per viewer when enabled", () => {
  const m = liveMatch();
  assert.equal(castChatVote(m, "ronaldo", "luna", DEFAULT_SETTINGS).ok, true);
  assert.equal(castChatVote(m, "ronaldo", "luna", DEFAULT_SETTINGS).reason, "duplicate");
  assert.equal(m.votesA, DEFAULT_SETTINGS.chatWeight);
});

test("gift votes stack and use the gift weight", () => {
  const m = liveMatch();
  castGiftVote(m, "messi", "omar", DEFAULT_SETTINGS, 3);
  assert.equal(m.votesB, DEFAULT_SETTINGS.giftWeight * 3);
});

test("tie rules pick a deterministic winner where required", () => {
  const m = liveMatch();
  castChatVote(m, "ronaldo", "a", DEFAULT_SETTINGS);
  castChatVote(m, "messi", "b", DEFAULT_SETTINGS);
  const settings: Settings = { ...DEFAULT_SETTINGS, tieRule: "higher-seed" };
  assert.equal(resolveWinner(m, settings, () => 0.9), "ronaldo");

  const random: Settings = { ...DEFAULT_SETTINGS, tieRule: "random" };
  assert.equal(resolveWinner(m, random, () => 0.1), "ronaldo");
  assert.equal(resolveWinner(m, random, () => 0.9), "messi");

  const sudden: Settings = { ...DEFAULT_SETTINGS, tieRule: "sudden-death" };
  assert.equal(resolveWinner(m, sudden, () => 0.5), null);
});

test("clear winners are returned regardless of tie rule", () => {
  const m = liveMatch();
  castGiftVote(m, "ronaldo", "x", DEFAULT_SETTINGS);
  castChatVote(m, "messi", "y", { ...DEFAULT_SETTINGS, chatWeight: 500 });
  assert.equal(resolveWinner(m, DEFAULT_SETTINGS, () => 0.5), "messi");
});
