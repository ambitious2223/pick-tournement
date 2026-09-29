import { test } from "node:test";
import assert from "node:assert/strict";
import type { Category } from "../shared/types.ts";
import { buildBracket, isRoundComplete, tournamentChampion } from "./bracket.ts";
import { completeMatch, createTournament, currentMatch } from "./tournament.ts";
import { DEFAULT_SETTINGS } from "../shared/config.ts";

function category(n = 16): Category {
  return {
    id: "test",
    name: "Test",
    items: Array.from({ length: n }, (_, i) => ({
      id: `i${i}`,
      name: `Item ${i}`,
      aliases: [],
    })),
  };
}

test("builds a 16-slot bracket with 8 first-round matches", () => {
  const bracket = buildBracket(category());
  assert.equal(bracket.rounds.r16.length, 8);
  assert.equal(bracket.rounds.qf.length, 4);
  assert.equal(bracket.rounds.sf.length, 2);
  assert.equal(bracket.rounds.final.length, 1);
  const ids = bracket.rounds.r16.flatMap((m) => [m.a, m.b]);
  assert.equal(ids.length, 16);
  assert.equal(new Set(ids).size, 16);
});

test("winners advance into the correct next-round slot", () => {
  const t = createTournament(category(), "t1");
  const m0 = t.bracket.rounds.r16[0];
  const m1 = t.bracket.rounds.r16[1];
  assert.ok(m0 && m1 && m0.a && m1.a);
  completeMatch(t, m0.a);
  assert.equal(t.bracket.rounds.qf[0]?.a, m0.a);
  completeMatch(t, m1.a);
  assert.equal(t.bracket.rounds.qf[0]?.b, m1.a);
});

test("a full simulated tournament produces a champion", () => {
  const t = createTournament(category(), "t2");
  const guard = 100;
  let steps = 0;
  while (t.status !== "done" && steps < guard) {
    const match = currentMatch(t);
    assert.ok(match, "expected a live match");
    const winner = match.a ?? match.b;
    assert.ok(winner);
    completeMatch(t, winner);
    steps++;
  }
  assert.equal(steps, 15);
  assert.equal(t.status, "done");
  assert.ok(t.champion);
  assert.ok(isRoundComplete(t.bracket.rounds.final));
  assert.equal(tournamentChampion(t.bracket), t.champion);
  assert.ok(DEFAULT_SETTINGS.chatWeight >= 1);
});
