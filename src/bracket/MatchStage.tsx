import { useEffect, useRef, useState, type ReactNode } from "react";
import type { RoundId, SessionState } from "../../shared/types.ts";
import { activeMatch } from "../lib/selectors.ts";
import { useNow } from "../lib/live.ts";
import { Stage } from "../stage/Stage.tsx";
import { ClashOutro, type ClashOutroData } from "../overlay/ClashOutro.tsx";
import { BracketCinema } from "./BracketCinema.tsx";

/** How long the decided clash is held on screen before the bracket appears. */
const OUTRO_MS = 1200;

/**
 * The tournament "stage". Two phases, chosen by `state.stageView`:
 * - "match": the live voting screen (photos, names, timer, votes) on its own.
 * - "bracket": the full bracket fills the stage so every name is clearly visible.
 * The outer `key` remounts the phase so the in/out animations replay on every switch.
 * When the view flips because a match just ended, the decided clash is held for
 * a beat first (`ClashOutro`: the loser drops, the winner flares).
 */
export function MatchStage({ state, variant }: { state: SessionState; variant: "control" | "overlay" }): ReactNode {
  const match = activeMatch(state);
  const tourney = state.tournament;
  const live = tourney !== null && tourney.status !== "done" && match !== null;

  const now = useNow(state.status === "running" && state.matchEndsAt !== null);
  const urgent =
    state.status === "running" && state.matchEndsAt !== null && (state.matchEndsAt - now) / 1000 <= 10;

  const [outro, setOutro] = useState<{ data: ClashOutroData; id: number } | null>(null);
  const prevViewRef = useRef(state.stageView);
  const lastMatchRef = useRef<{ round: RoundId; index: number } | null>(null);
  const outroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outroIdRef = useRef(0);

  useEffect(() => {
    const prev = prevViewRef.current;
    prevViewRef.current = state.stageView;
    if (state.stageView === "match" && match && tourney?.status !== "done") {
      lastMatchRef.current = { round: match.round, index: match.index };
    }
    if (prev === "match" && state.stageView === "bracket" && lastMatchRef.current && tourney) {
      const last = lastMatchRef.current;
      // The old match object is a stale snapshot; look the finished match up in
      // the latest bracket so its final votes and winner are the real ones.
      const m = tourney.bracket.rounds[last.round][last.index];
      if (m && m.status === "done" && m.winner) {
        outroIdRef.current += 1;
        const id = outroIdRef.current;
        setOutro({
          id,
          data: { round: m.round, a: m.a, b: m.b, winner: m.winner, votesA: m.votesA, votesB: m.votesB },
        });
        if (outroTimerRef.current) clearTimeout(outroTimerRef.current);
        outroTimerRef.current = setTimeout(() => {
          setOutro((current) => (current && current.id === id ? null : current));
        }, OUTRO_MS);
      }
    }
  }, [state.stageView, match, tourney]);
  useEffect(() => () => {
    if (outroTimerRef.current) clearTimeout(outroTimerRef.current);
  }, []);

  const height = variant === "overlay" ? "min-h-screen" : "h-full min-h-[420px]";
  const cardWidth = variant === "overlay" ? "max-w-7xl" : "max-w-6xl";
  const bracketPhase = !outro && live && tourney && state.stageView === "bracket";

  return (
    <div key={state.stageView} className={`relative w-full ${height}`}>
      {outro ? (
        <div className="absolute inset-0">
          <ClashOutro state={state} data={outro.data} variant={variant === "overlay" ? "overlay" : "control"} durationMs={OUTRO_MS} />
        </div>
      ) : bracketPhase ? (
        <div className="animate-view-in absolute inset-0 p-4">
          <div className="relative h-full w-full">
            <BracketCinema
              state={state}
              mode="intro"
              variant={variant === "overlay" ? "overlay" : "control"}
              cinematic={state.settings.controlCinematic}
            />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex p-3">
          <div
            className={`animate-match-in mx-auto flex h-full w-full ${cardWidth} flex-col rounded-2xl border bg-ink/75 p-4 shadow-2xl backdrop-blur-md ${
              urgent ? "animate-pulse-ring border-hot" : "border-line"
            }`}
          >
            <Stage state={state} variant={variant === "overlay" ? "overlay" : "control"} />
          </div>
        </div>
      )}
    </div>
  );
}
