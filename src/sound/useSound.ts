import { useEffect, useRef } from "react";
import type { SessionState } from "../../shared/types.ts";
import { ROUND_ORDER } from "../../shared/config.ts";
import { activeMatch } from "../lib/selectors.ts";
import { send } from "../lib/live.ts";
import { sound } from "./manager.ts";

/** High-frequency cues we don't forward to Tikora (would flood the relay). */
const NOT_FORWARDED = new Set(["vote.chat", "live.like", "live.member", "match.tick", "category.vote", "live.share", "live.follow"]);

function roundIndex(state: SessionState): number {
  const round = state.tournament?.currentRound;
  const idx = round ? ROUND_ORDER.indexOf(round) : 0;
  return idx < 0 ? 0 : idx;
}

/**
 * Drives the whole soundscape from the live session. Mounted only on the
 * broadcast page so viewers hear one clean mix and the host never gets doubles.
 *
 * Two sources feed it: the automatic show's phase machine, and — when the host
 * runs matches manually from the Control room — the live match state itself.
 */
export function useSound(state: SessionState | null): void {
  const phaseRef = useRef<string>("");
  const tickRef = useRef<number>(-1);
  const timersRef = useRef<number[]>([]);
  const matchRef = useRef<string>("");
  const champRef = useRef<string>("");

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
        sound.setMusic("music.category");
        break;
      case "round-intro":
        sound.play("round.intro", { roundIndex: roundIndex(state) });
        break;
      case "bracket-intro":
        sound.play("bracket.intro");
        break;
      case "bracket-outro":
        sound.play("match.end");
        sound.play("bracket.winner");
        break;
      case "match":
        sound.play("match.start");
        sound.setMusic(`music.match.${ROUND_ORDER[roundIndex(state)]}`);
        break;
      case "result": {
        sound.play("result.win");
        if (state.show.champion) {
          sound.setMusic("music.champion");
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
        sound.setMusic("music.champion");
        break;
      default:
        sound.setMusic(null);
    }
  }, [state?.show.phase]);

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
      sound.setMusic(`music.match.${match.round}`);
    } else if (match.status === "done" && wasLive) {
      sound.play("result.win");
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
    sound.setMusic("music.champion");
  }, [state?.tournament?.status, state?.tournament?.id, state?.show.active]);

  // Stop the music bed when nothing is running any more.
  useEffect(() => {
    if (!state) return;
    if (!state.tournament && !state.show.active) sound.setMusic(null);
  }, [state?.tournament?.id, state?.show.active]);

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

  // Countdown + last-10-second ticks for the live match (show or manual).
  useEffect(() => {
    const match = state ? activeMatch(state) : null;
    if (!state || state.status !== "running" || !match || match.status !== "live" || match.endsAt === null) {
      tickRef.current = -1;
      return;
    }
    const endsAt = match.endsAt;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (remaining <= 10 && remaining > 0 && remaining !== tickRef.current) {
        tickRef.current = remaining;
        sound.play("match.tick");
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [state?.status, state?.matchEndsAt, state?.tournament]);
}
