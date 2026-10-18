import { test } from "node:test";
import assert from "node:assert/strict";
import { focusTransform, shotTransform, slot } from "../src/bracket/camera.ts";

test("focusTransform puts the active slot dead-centre", () => {
  const s = slot("r16", 0);
  assert.deepEqual(s, { x: 7, y: 12.5 });
  const shot = focusTransform(s!, 3);
  assert.equal(shot.scale, 3);
  assert.equal(shot.tx, 43);
  assert.equal(shot.ty, 37.5);
});

test("every match slot maps to the screen centre at any zoom", () => {
  const counts: Record<string, number> = { r16: 8, qf: 4, sf: 2, final: 1 };
  for (const round of ["r16", "qf", "sf", "final"] as const) {
    for (let i = 0; i < counts[round]!; i += 1) {
      const s = slot(round, i);
      assert.ok(s, `${round}:${i} has a slot`);
      const { tx, ty, scale } = focusTransform(s!, 3.5);
      // A point at percentage p maps to scale * ((p - 50) + t); the slot must hit 0.
      assert.ok(Math.abs(scale * (s!.x - 50 + tx)) < 1e-9, `${round}:${i} centred in x`);
      assert.ok(Math.abs(scale * (s!.y - 50 + ty)) < 1e-9, `${round}:${i} centred in y`);
    }
  }
});

test("no focus falls back to the wide shot", () => {
  assert.equal(shotTransform(null, 3), "scale(1) translate(0%, 0%)");
});
