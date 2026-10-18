import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, estimateShowSchedule } from "../shared/config.ts";

test("a full tournament plays one bracket cinematic per match", () => {
  const { phases } = estimateShowSchedule(DEFAULT_SETTINGS);
  const byKey = Object.fromEntries(phases.map((phase) => [phase.key, phase]));
  assert.equal(byKey.bracketIntro?.count, 15);
  assert.equal(byKey.bracketOutro?.count, 15);
  assert.equal(byKey.roundRecap?.count, 3);
  assert.equal(byKey.match?.count, 15);
  assert.equal(byKey.result?.count, 15);
  assert.equal(byKey.roundIntro?.count, 4);
});

test("turning a cinematic off removes its time from the total", () => {
  const all = estimateShowSchedule(DEFAULT_SETTINGS).totalSeconds;
  const noIntro = estimateShowSchedule({ ...DEFAULT_SETTINGS, showBracketIntro: false });
  const noOutro = estimateShowSchedule({ ...DEFAULT_SETTINGS, showBracketOutro: false });
  const noRecap = estimateShowSchedule({ ...DEFAULT_SETTINGS, showRoundRecap: false });
  const none = estimateShowSchedule({
    ...DEFAULT_SETTINGS,
    showBracketIntro: false,
    showBracketOutro: false,
    showRoundRecap: false,
  });

  assert.ok(noIntro.totalSeconds < all, "intro off should shorten the show");
  assert.ok(noOutro.totalSeconds < all, "outro off should shorten the show");
  assert.ok(noRecap.totalSeconds < all, "recap off should shorten the show");
  assert.ok(none.totalSeconds < noIntro.totalSeconds);
  assert.ok(none.totalSeconds < noOutro.totalSeconds);
  assert.equal(
    none.phases.find((phase) => phase.key === "bracketIntro")?.seconds,
    0,
  );
  assert.equal(
    none.phases.find((phase) => phase.key === "bracketOutro")?.seconds,
    0,
  );
  assert.equal(
    none.phases.find((phase) => phase.key === "roundRecap")?.seconds,
    0,
  );
});

test("pace scales only the cinematic phases", () => {
  const base = estimateShowSchedule(DEFAULT_SETTINGS);
  const slow = estimateShowSchedule({ ...DEFAULT_SETTINGS, bracketPace: 2 });
  const baseOutro = base.phases.find((phase) => phase.key === "bracketOutro")?.seconds ?? 0;
  const slowOutro = slow.phases.find((phase) => phase.key === "bracketOutro")?.seconds ?? 0;
  assert.equal(Math.round(slowOutro), Math.round(baseOutro * 2));

  const baseMatch = base.phases.find((phase) => phase.key === "match")?.seconds ?? 0;
  const slowMatch = slow.phases.find((phase) => phase.key === "match")?.seconds ?? 0;
  assert.equal(slowMatch, baseMatch);
});
