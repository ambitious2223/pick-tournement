import type { Rng } from "./match.ts";

const FAKE_VIEWERS = [
  "luna_x",
  "rambo_92",
  "zeynep",
  "omar.f",
  "no_game_no_life",
  "tiny_chef",
  "ghostrider",
  "mira7",
  "the_real_ahmad",
  "pixel_panda",
  "kadir",
  "sofia.v",
  "big_mac",
  "nora_88",
  "leo_messi_fan",
  "quiet_storm",
];

export function fakeViewer(rng: Rng): string {
  const base = FAKE_VIEWERS[Math.floor(rng() * FAKE_VIEWERS.length)] ?? "viewer";
  return `${base}_${Math.floor(rng() * 1000)}`;
}

export function pickSide(rng: Rng, biasA = 0.5): "a" | "b" {
  return rng() < biasA ? "a" : "b";
}

export function randomBias(rng: Rng): number {
  return 0.35 + rng() * 0.3;
}
