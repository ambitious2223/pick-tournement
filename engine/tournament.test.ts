import { test } from "node:test";
import assert from "node:assert/strict";
import type { Category, Item } from "../shared/types.ts";
import { completeMatch, createTournament, currentMatch } from "./tournament.ts";

function categoryOf(count: number): Category {
  const items: Item[] = Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Competitor ${i + 1}`,
    aliases: [`بديل ${i + 1}`],
  }));
  return { id: "bye-test", name: "Bye Test", nameAr: "اختبار", items };
}

function playThrough(category: Category): { tournament: ReturnType<typeof createTournament>; steps: number } {
  const tournament = createTournament(category, "t1");
  let steps = 0;
  while (tournament.status !== "done" && steps < 300) {
    steps++;
    const match = currentMatch(tournament);
    if (!match) break;
    const bothEmpty = match.a === null && match.b === null;
    completeMatch(tournament, bothEmpty ? null : match.a ?? match.b);
  }
  return { tournament, steps };
}

test("an empty slot closes without a winner and pushes nothing forward", () => {
  const tournament = createTournament(categoryOf(5), "t1");
  tournament.currentRound = "r16";
  tournament.currentMatchIndex = 3;

  const progress = completeMatch(tournament, null);

  assert.equal(tournament.bracket.rounds.r16[3]?.status, "done");
  assert.equal(tournament.bracket.rounds.r16[3]?.winner, "");
  assert.equal(tournament.bracket.rounds.qf[1]?.b, null, "nothing should be pushed into the next round");
  assert.equal(progress.roundComplete, false);
});

test("a match with one competitor advances them", () => {
  const tournament = createTournament(categoryOf(5), "t1");
  tournament.currentRound = "r16";
  tournament.currentMatchIndex = 2;
  const bye = currentMatch(tournament);

  assert.ok(bye);
  assert.equal(bye.a, "item-5");
  assert.equal(bye.b, null);

  completeMatch(tournament, bye.a);
  assert.equal(tournament.bracket.rounds.qf[1]?.a, "item-5");
});

test("any competitor count from 1 to 16 produces a finished bracket with a champion", () => {
  for (const count of [1, 2, 3, 5, 8, 10, 15, 16]) {
    const { tournament, steps } = playThrough(categoryOf(count));
    assert.equal(tournament.status, "done", `${count} competitors did not finish`);
    assert.match(tournament.champion ?? "", /^item-\d+$/, `${count} competitors produced a bad champion`);
    assert.ok(steps < 300, `${count} competitors looped for ${steps} steps`);
  }
});

test("a full 16-slot bracket contains no empty slots", () => {
  const { tournament } = playThrough(categoryOf(16));
  for (const round of Object.values(tournament.bracket.rounds)) {
    for (const match of round) {
      assert.ok(match.a !== null && match.b !== null, `${match.id} has an empty slot`);
    }
  }
});
