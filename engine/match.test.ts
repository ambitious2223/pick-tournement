import { test } from "node:test";
import assert from "node:assert/strict";
import type { Item, Match, Settings } from "../shared/types.ts";
import { DEFAULT_SETTINGS } from "../shared/config.ts";
import { matchItem, normalize } from "./matcher.ts";
import { addVotes, castChatVote, castGiftVote, resolveWinner, shiftVotes } from "./match.ts";

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

test("hub power-ups add raw votes to one side", () => {
  const m = liveMatch();
  assert.equal(addVotes(m, "a", 10), true);
  assert.equal(m.votesA, 10);
  assert.equal(addVotes(m, "b", 4.7), true);
  assert.equal(m.votesB, 4);
  assert.equal(addVotes(m, "a", 0), false);
  assert.equal(addVotes(m, "a", -5), false);
  assert.equal(addVotes(m, "a", Number.NaN), false);
  assert.equal(m.votesA, 10);
});

test("stealing votes never flips the lead and never invents votes", () => {
  const m = liveMatch();
  m.votesA = 10;
  const total = m.votesA + m.votesB;

  assert.equal(shiftVotes(m, 6), "b");
  assert.ok(m.votesA >= m.votesB, `leader must stay ahead or tied, got ${m.votesA}-${m.votesB}`);
  assert.equal(m.votesA + m.votesB, total, "votes must be moved, not created");

  m.votesA = 10;
  m.votesB = 0;
  assert.equal(shiftVotes(m, 100), "b");
  assert.ok(m.votesA >= m.votesB, `leader must stay ahead or tied, got ${m.votesA}-${m.votesB}`);
  assert.equal(m.votesA + m.votesB, total);
});

test("stealing is refused when the gap is a single vote", () => {
  const m = liveMatch();
  m.votesA = 1;
  assert.equal(shiftVotes(m, 5), null);
  assert.equal(m.votesA, 1);
  assert.equal(m.votesB, 0);
});

test("shifting votes is refused on a tie, on a finished match, or with no amount", () => {
  const m = liveMatch();
  m.votesA = 5;
  m.votesB = 5;
  assert.equal(shiftVotes(m, 3), null);

  m.votesB = 9;
  assert.equal(shiftVotes(m, 0), null);
  m.status = "done";
  assert.equal(shiftVotes(m, 3), null);
  assert.equal(addVotes(m, "a", 3), false);
});
