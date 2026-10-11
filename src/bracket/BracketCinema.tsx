import { useEffect, useState, type ReactNode } from "react";
import type { Item, Match, RoundId, SessionState } from "../../shared/types.ts";
import { bracketTension, ROUND_ORDER, roundIndexFor } from "../../shared/config.ts";
import { useI18n } from "../i18n/index.tsx";
import { activeCategory, getItem, itemName } from "../lib/selectors.ts";
import { ItemVisual } from "../overlay/ItemVisual.tsx";
import { useCinemaCamera, type CinemaMode } from "./useCinemaCamera.ts";

const CARD_W = 13;
const HALF = CARD_W / 2;
const ROUND_MATCHES: Record<string, number> = { r16: 8, qf: 4, sf: 2, final: 1 };
const X_LEFT = [7, 21, 35];
const X_RIGHT = [93, 79, 65];

/** Percentage slot (center) for a match in the mirrored bracket. */
function slot(round: RoundId, index: number): { x: number; y: number } | null {
  const depth = ROUND_ORDER.indexOf(round);
  if (depth < 0 || index < 0) return null;
  const count = ROUND_MATCHES[round] ?? 1;
  if (round === "final") return { x: 50, y: 50 };
  if (index >= count) return null;
  const half = count / 2;
  const left = index < half;
  const local = left ? index : index - half;
  const x = (left ? X_LEFT[depth] : X_RIGHT[depth]) ?? 50;
  const y = ((local + 0.5) / half) * 100;
  return { x, y };
}

function CompRow({
  item,
  side,
  won,
  lost,
  lang,
}: {
  item: Item | null;
  side: "a" | "b";
  won: boolean;
  lost: boolean;
  lang: "ar" | "en";
}): ReactNode {
  const { t } = useI18n();
  const tone = won ? "text-lime" : lost ? "text-hot/80" : side === "a" ? "text-brand" : "text-brand-2";
  return (
    <div className={`relative flex items-center gap-1.5 ${tone}`}>
      <ItemVisual item={item} className={`h-9 w-9 shrink-0 ${lost ? "opacity-60" : ""}`} emojiClassName="text-base" />
      <span className={`min-w-0 flex-1 truncate text-start text-[0.7rem] font-bold leading-tight ${lost ? "line-through opacity-60" : ""}`}>
        {item ? itemName(item, lang) : t("common.tbd")}
      </span>
      {won ? <span className="shrink-0 text-xs font-black text-lime">✓</span> : null}
      {lost ? <span className="animate-x shrink-0 text-base font-black text-hot">✕</span> : null}
    </div>
  );
}

function CinemaCard({
  match,
  itemA,
  itemB,
  active,
  lang,
}: {
  match: Match;
  itemA: Item | null;
  itemB: Item | null;
  active: boolean;
  lang: "ar" | "en";
}): ReactNode {
  const done = match.winner !== null;
  const state = active
    ? "z-20 scale-105 ring-2 ring-[color:var(--round)] shadow-[0_0_28px_-6px_var(--round)]"
    : done
      ? "animate-winner border-lime/50 shadow-[0_0_24px_-6px_#a3e635]"
      : "opacity-60";
  return (
    <div className={`rounded-lg border border-line bg-ink-2/80 p-1.5 ${state}`}>
      <CompRow item={itemA} side="a" won={done && match.winner === match.a} lost={done && match.a !== null && match.winner !== match.a} lang={lang} />
      <CompRow item={itemB} side="b" won={done && match.winner === match.b} lost={done && match.b !== null && match.winner !== match.b} lang={lang} />
    </div>
  );
}

export function BracketCinema({
  state,
  mode,
  variant = "overlay",
}: {
  state: SessionState;
  mode: CinemaMode;
  variant?: "overlay" | "control";
}): ReactNode {
  const { t, lang, round } = useI18n();
  const tournament = state.tournament;
  const roundIndex = roundIndexFor(tournament?.currentRound);
  const baseSeconds =
    mode === "intro" ? state.settings.bracketIntroSeconds : mode === "outro" ? state.settings.bracketOutroSeconds : state.settings.roundRecapSeconds;
  const durationMs = baseSeconds * 1000 * bracketTension(roundIndex) * (state.settings.bracketPace ?? 1);
  const activeKey = tournament ? `${tournament.currentRound}:${tournament.currentMatchIndex}:${mode}` : "none";
  const { transform } = useCinemaCamera(activeKey, mode, roundIndex, durationMs);
  const overlay = variant === "overlay";
  const camera = overlay ? transform : "none";

  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    setDrawn(false);
    const id = window.setTimeout(() => setDrawn(true), 60);
    return () => window.clearTimeout(id);
  }, [activeKey]);

  if (!tournament) {
    return (
      <div className="relative grid h-full w-full place-items-center">
        <div className="chip text-2xl font-black text-[color:var(--round)]">{t("show.bracketTitle")}</div>
      </div>
    );
  }

  const category = activeCategory(state);
  const bracket = tournament.bracket;
  const title = mode === "recap" ? t("show.phase.round-recap") : t("show.bracketTitle");

  const edges: { d: string; active: boolean }[] = [];
  for (let d = 0; d < ROUND_ORDER.length - 1; d += 1) {
    const fromR = ROUND_ORDER[d];
    const toR = ROUND_ORDER[d + 1];
    if (!fromR || !toR) continue;
    (bracket.rounds[toR] ?? []).forEach((_, j) => {
      [2 * j, 2 * j + 1].forEach((k) => {
        const s = slot(fromR, k);
        const e = slot(toR, j);
        if (!s || !e) return;
        const flip = s.x > e.x;
        const sx = flip ? s.x - HALF : s.x + HALF;
        const ex = flip ? e.x + HALF : e.x - HALF;
        const mx = (sx + ex) / 2;
        edges.push({
          d: `M ${sx} ${s.y} L ${mx} ${s.y} L ${mx} ${e.y} L ${ex} ${e.y}`,
          active: fromR === tournament.currentRound && k === tournament.currentMatchIndex,
        });
      });
    });
  }

  return (
    <div className={`relative h-full w-full overflow-hidden round-${tournament.currentRound}`}>
      <div
        className="absolute inset-0"
        style={{ transform: camera, transition: overlay ? "transform 1.2s cubic-bezier(0.22,1,0.36,1)" : undefined }}
      >
        <div className="relative h-full w-full">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {edges.map((edge, i) => (
              <path
                key={i}
                d={edge.d}
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="var(--round)"
                strokeWidth={edge.active ? 3 : 1.5}
                strokeLinecap="round"
                strokeOpacity={edge.active ? 1 : 0.35}
                style={{
                  strokeDasharray: "200",
                  strokeDashoffset: drawn ? "0" : "200",
                  transition: `stroke-dashoffset 1.4s ease ${i * 40}ms`,
                }}
              />
            ))}
          </svg>

          {ROUND_ORDER.map((rid) => {
            const depth = ROUND_ORDER.indexOf(rid);
            const xs: number[] = rid === "final" ? [50] : [X_LEFT[depth] ?? 50, X_RIGHT[depth] ?? 50];
            return xs.map((x) => (
              <div
                key={`${rid}-${x}`}
                className="chip absolute top-[1%] -translate-x-1/2 whitespace-nowrap text-[0.6rem]"
                style={{ left: `${x}%` }}
              >
                {round(rid)}
              </div>
            ));
          })}

          {ROUND_ORDER.map((rid) =>
            (bracket.rounds[rid] ?? []).map((match, index) => {
              const p = slot(rid, index);
              if (!p || !match) return null;
              const active = rid === tournament.currentRound && index === tournament.currentMatchIndex;
              return (
                <div
                  key={match.id}
                  className="absolute"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: `${CARD_W}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <CinemaCard
                    match={match}
                    itemA={getItem(category, match.a)}
                    itemB={getItem(category, match.b)}
                    active={active}
                    lang={lang}
                  />
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="chip absolute start-4 top-4 z-30 text-sm font-bold text-[color:var(--round)]">{title}</div>

      {overlay ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
          <div className="absolute inset-x-0 top-0 z-40 h-[6%] bg-ink" />
          <div className="absolute inset-x-0 bottom-0 z-40 h-[6%] bg-ink" />
        </>
      ) : null}
    </div>
  );
}
