import { useEffect, useRef } from "react";
import type { SessionState } from "../../shared/types.ts";
import { bracketTension, roundIndexFor } from "../../shared/config.ts";
import { activeMatch } from "../lib/selectors.ts";
import { send } from "../lib/live.ts";
import { sound } from "./manager.ts";

/** High-frequency cues we don't forward to Tikora (would flood the relay). */
const NOT_FORWARDED = new Set(["vote.chat", "live.like", "live.member", "match.tick", "category.vote", "live.share", "live.follow"]);

function roundIndex(state: SessionState): number {
  return roundIndexFor(state.tournament?.currentRound);
}

/** How long a bracket phase lasts, matching the server (seconds × tension × pace). */
function phaseMs(state: SessionState, seconds: number): number {
  return seconds * 1000 * bracketTension(roundIndex(state)) * (state.settings.bracketPace ?? 1);
}

/**
 * Drives the whole soundscape from the live session. Mounted only on the
 * broadcast page so viewers hear one clean mix and the host never gets doubles.
 *
 * Every cue is an upload (data/sounds/<id>.<ext>); a cue with no file stays
 * silent. Two sources feed it: the automatic show's phase machine, and — when
 * the host runs matches manually from the Control room — the live match state.
 */
export function useSound(state: SessionState | null): void {
  const phaseRef = useRef<string>("");
  const tickRef = useRef<number>(-1);
  const lastRemainingRef = useRef<number>(-1);
  const timersRef = useRef<number[]>([]);
  const matchRef = useRef<string>("");
  const champRef = useRef<string>("");
  const catVotesRef = useRef<number>(0);
  /** Live clock snapshot the tick interval reads without re-creating itself. */
  const liveRef = useRef<{ endsAt: number | null; tied: boolean }>({ endsAt: null, tied: false });

  useEffect(() => {
    if (state) sound.setConfig(state.settings.sound);
  }, [state?.settings.sound]);

  useEffect(() => {
    sound.onCue = (id: string): void => {
      if (!NOT_FORWARDED.has(id)) void send("cue:emit", { id });
    };
    return () => {
      sound.onCue = null;
    };
  }, []);

  useEffect(() => {
    void sound.unlock();
    const onGesture = (): void => void sound.unlock();
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  // Clear staggered timers on phase change.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, [state?.show.phase]);

  // Keep the interval's clock snapshot current without restarting it.
  useEffect(() => {
    const match = state ? activeMatch(state) : null;
    liveRef.current = { endsAt: match?.endsAt ?? null, tied: Boolean(match && match.votesA === match.votesB) };
  }, [state]);

  // --- Automatic show: phase-driven cues -------------------------------------
  useEffect(() => {
    if (!state) return;
    const phase = state.show.phase;
    const prev = phaseRef.current;
    if (phase === prev) return;
    phaseRef.current = phase;

    if (prev === "category" && phase !== "category") sound.play("category.winner");

    switch (phase) {
      case "category":
        sound.play("category.start");
        break;
      case "round-intro":
        sound.play("round.intro");
        break;
      case "bracket-intro": {
        sound.play("bracket.intro");
        sound.play("bracket.zoom.in");
        const r = roundIndex(state);
        if (r >= 2) sound.play("bracket.tension");
        const ms = phaseMs(state, state.settings.bracketIntroSeconds);
        // The camera settles on the live match, then a 3-2-1 before the whistle.
        timersRef.current.push(window.setTimeout(() => sound.play("bracket.focus"), Math.max(0, ms * 0.6)));
        for (const off of [1400, 900, 400]) {
          const at = ms - off;
          if (at > 0) timersRef.current.push(window.setTimeout(() => sound.play("match.countdown"), at));
        }
        break;
      }
      case "bracket-outro": {
        sound.play("match.end");
        sound.play("bracket.reveal");
        sound.play("bracket.loser");
        const ms = phaseMs(state, state.settings.bracketOutroSeconds);
        timersRef.current.push(window.setTimeout(() => sound.play("bracket.outro"), Math.max(0, ms * 0.8)));
        break;
      }
      case "round-recap":
        sound.play("bracket.intro");
        sound.play("bracket.winner");
        break;
      case "match":
        sound.play("match.start");
        break;
      case "result": {
        sound.play("result.win");
        sound.play("result.lose");
        if (state.show.champion) {
          sound.play("champion.win");
          timersRef.current.push(window.setTimeout(() => sound.play("champion.reveal"), 800));
          state.live.supporters.forEach((_, i) => {
            timersRef.current.push(window.setTimeout(() => sound.play("champion.supporter"), 1500 + i * 350));
          });
        }
        break;
      }
      case "champion":
        sound.play("champion.win");
        break;
      default:
        break;
    }
  }, [state?.show.phase]);

  // Category votes (each vote that lands during the category poll).
  useEffect(() => {
    if (!state) return;
    const sum = Object.values(state.show.categoryVotes).reduce((a, b) => a + b, 0);
    if (sum > catVotesRef.current && state.show.phase === "category") sound.play("category.vote");
    catVotesRef.current = sum;
  }, [state?.show.categoryVotes]);

  // --- Manual play (no show active): match-driven cues -----------------------
  useEffect(() => {
    if (!state || state.show.active) return;
    const match = activeMatch(state);
    if (!match) {
      matchRef.current = "";
      return;
    }
    const key = `${match.id}:${match.status}`;
    if (matchRef.current === key) return;
    const wasLive = matchRef.current.endsWith(":live");
    matchRef.current = key;

    if (match.status === "live") {
      sound.play("match.start");
    } else if (match.status === "done" && wasLive) {
      sound.play("result.win");
      sound.play("result.lose");
    }
  }, [state?.status, state?.show.active, state?.tournament]);

  // Manual champion reveal.
  useEffect(() => {
    if (!state || state.show.active) return;
    const id = state.tournament?.status === "done" ? state.tournament.id : "";
    if (!id) {
      champRef.current = "";
      return;
    }
    if (champRef.current === id) return;
    champRef.current = id;
    sound.play("champion.win");
  }, [state?.tournament?.status, state?.tournament?.id, state?.show.active]);

  // Live events (chat/gift/like/follow/share/subscribe/member).
  useEffect(() => {
    if (!state) return;
    sound.observeLiveCounts(state.live.counts, state.live.lastEvents);
  }, [state?.live.counts]);

  // Vote leader changes.
  useEffect(() => {
    if (!state) return;
    const match = activeMatch(state);
    if (!match) return;
    const leader = match.votesA === match.votesB ? "tie" : match.votesA > match.votesB ? "a" : "b";
    sound.observeLeader(leader);
  }, [state?.tournament]);

  // Countdown ticks, plus sudden-death detection when the clock jumps back up.
  useEffect(() => {
    if (!state || state.status !== "running" || !state.tournament) {
      tickRef.current = -1;
      lastRemainingRef.current = -1;
      return;
    }
    tickRef.current = -1;
    lastRemainingRef.current = -1;
    const id = window.setInterval(() => {
      const { endsAt, tied } = liveRef.current;
      if (endsAt === null) return;
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (remaining <= 10 && remaining > 0 && remaining !== tickRef.current) {
        tickRef.current = remaining;
        sound.play("match.tick");
      }
      if (lastRemainingRef.current >= 0 && lastRemainingRef.current <= 1 && remaining > 2 && tied) {
        sound.play("match.suddenDeath");
      }
      lastRemainingRef.current = remaining;
    }, 200);
    return () => window.clearInterval(id);
    // Stable keys only, so the interval survives the per-frame state updates.
  }, [state?.status, state?.tournament?.id, state?.tournament?.currentRound, state?.tournament?.currentMatchIndex]);
}
