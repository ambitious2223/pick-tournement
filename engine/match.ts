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

/** Adds raw votes to one side (hub power-up). Returns false when unusable. */
export function addVotes(match: Match, side: "a" | "b", amount: number): boolean {
  if (match.status !== "live") return false;
  if (!Number.isFinite(amount)) return false;
  const points = Math.floor(amount);
  if (points <= 0) return false;
  if (side === "a") match.votesA += points;
  else match.votesB += points;
  return true;
}

/**
 * Moves votes from the side that is winning to the side that is losing. Never
 * moves more than half the gap, so the lead can be shaken but not handed over
 * (and not even tied when the gap is a single vote). Returns the side that
 * received the votes, or null when it can't run.
 */
export function shiftVotes(match: Match, amount: number): "a" | "b" | null {
  if (match.status !== "live") return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const diff = match.votesA - match.votesB;
  if (diff === 0) return null;
  const from: "a" | "b" = diff > 0 ? "a" : "b";
  const to: "a" | "b" = from === "a" ? "b" : "a";
  const safe = Math.floor(Math.abs(diff) / 2);
  const move = Math.min(Math.floor(amount), safe);
  if (move <= 0) return null;
  if (from === "a") {
    match.votesA -= move;
    match.votesB += move;
  } else {
    match.votesB -= move;
    match.votesA += move;
  }
  return to;
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
