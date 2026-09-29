import type { Match, Settings } from "../shared/types.ts";
import { normalize } from "./matcher.ts";

export type Rng = () => number;

export function sideOf(match: Match, itemId: string): "a" | "b" | null {
  if (match.a === itemId) return "a";
  if (match.b === itemId) return "b";
  return null;
}

export function hasVoted(match: Match, viewer: string): boolean {
  const key = normalize(viewer);
  return match.votersA.includes(key) || match.votersB.includes(key);
}

export interface VoteResult {
  ok: boolean;
  reason?: "no-side" | "duplicate" | "not-live";
}

export function castChatVote(match: Match, itemId: string, viewer: string, settings: Settings): VoteResult {
  if (match.status !== "live") return { ok: false, reason: "not-live" };
  const side = sideOf(match, itemId);
  if (!side) return { ok: false, reason: "no-side" };

  const key = normalize(viewer) || "anonymous";
  if (settings.dedupeChat && hasVoted(match, key)) return { ok: false, reason: "duplicate" };

  if (side === "a") {
    match.votesA += settings.chatWeight;
    match.votersA.push(key);
  } else {
    match.votesB += settings.chatWeight;
    match.votersB.push(key);
  }
  return { ok: true };
}

export function castGiftVote(match: Match, itemId: string, viewer: string, settings: Settings, count = 1): VoteResult {
  if (match.status !== "live") return { ok: false, reason: "not-live" };
  const side = sideOf(match, itemId);
  if (!side) return { ok: false, reason: "no-side" };

  const points = settings.giftWeight * Math.max(1, count);
  const key = normalize(viewer) || "anonymous";
  if (side === "a") {
    match.votesA += points;
    match.votersA.push(key);
  } else {
    match.votesB += points;
    match.votersB.push(key);
  }
  return { ok: true };
}

export function isTied(match: Match): boolean {
  return match.a !== null && match.b !== null && match.votesA === match.votesB;
}

export function resolveWinner(match: Match, settings: Settings, rng: Rng): string | null {
  if (match.a === null) return match.b;
  if (match.b === null) return match.a;
  if (match.votesA > match.votesB) return match.a;
  if (match.votesB > match.votesA) return match.b;

  if (settings.tieRule === "random") return rng() < 0.5 ? match.a : match.b;
  if (settings.tieRule === "higher-seed") return match.a;
  return null;
}

export function totalVotes(match: Match): number {
  return match.votesA + match.votesB;
}
