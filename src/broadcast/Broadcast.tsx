import { useState, type ReactNode } from "react";
import type { Item, SessionState } from "../../shared/types.ts";
import { useI18n, type TKey } from "../i18n/index.tsx";
import { useSound } from "../sound/useSound.ts";
import { enableSound, useSoundStatus } from "../sound/SoundStatus.tsx";
import { activeCategory, activeMatch, categoryName, getItem, itemName } from "../lib/selectors.ts";
import { BracketCinema } from "../bracket/BracketCinema.tsx";
import { Stage } from "../stage/Stage.tsx";
import { ItemVisual } from "../overlay/ItemVisual.tsx";
import { CategoryPoll } from "../overlay/CategoryPoll.tsx";
import { VoteToasts } from "../overlay/VoteToasts.tsx";
import { Avatar } from "../ui/Avatar.tsx";

function TopSupporters({ supporters }: { supporters: SessionState["live"]["supporters"] }): ReactNode {
  const { t } = useI18n();
  if (supporters.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-bold uppercase tracking-widest text-[color:var(--round)]">{t("live.supporters")}</div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {supporters.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center gap-2 rounded-full border border-[color:var(--round)] bg-ink/60 px-3 py-1 backdrop-blur-sm"
          >
            <span className="w-4 text-white/50">{i + 1}</span>
            <Avatar src={s.avatar} name={s.name} size={26} />
            <span className="max-w-[10rem] truncate font-bold">{s.name}</span>
            <span className="text-[color:var(--round)]">{t("live.points", { n: s.points })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoundUnlock({ settings }: { settings: SessionState["settings"]["sound"] }): ReactNode {
  const { t } = useI18n();
  const status = useSoundStatus();
  const [busy, setBusy] = useState(false);

  if (status.context === "running" && !status.muted) return null;
  const tone = status.muted ? "border-hot/60 text-hot" : "border-brand/60 text-brand";
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void enableSound(settings).finally(() => setBusy(false));
      }}
      className={`fixed bottom-4 start-4 z-50 rounded-full border bg-ink/80 px-4 py-2 text-sm font-bold backdrop-blur disabled:opacity-60 ${tone}`}
    >
      {status.muted ? `🔇 ${t("sound.mutedShort")}` : `🔊 ${t("sound.enable")}`}
    </button>
  );
}

function PhaseFrame({ children, animKey }: { children: ReactNode; animKey: string }): ReactNode {
  return (
    <div key={animKey} className="animate-view-in flex h-full w-full flex-col items-center justify-center gap-6 p-6">
      {children}
    </div>
  );
}

function ResultSide({
  item,
  votes,
  winner,
  side,
  lang,
}: {
  item: Item | null;
  votes: number;
  winner: boolean;
  side: "a" | "b";
  lang: "ar" | "en";
}): ReactNode {
  const { t } = useI18n();
  const ring = winner ? "ring-4 ring-lime" : "ring-2 ring-line";
  return (
    <div className={`animate-rise flex flex-col items-center gap-3 ${winner ? "" : "opacity-70"}`}>
      <div className={`relative h-[clamp(7rem,20vh,13rem)] w-[clamp(7rem,20vh,13rem)] overflow-hidden rounded-2xl ${ring}`}>
        <ItemVisual item={item} className="h-full w-full" emojiClassName="text-[clamp(2.5rem,8vh,5.5rem)]" />
        {!winner ? (
          <div className="absolute inset-0 grid place-items-center bg-ink/40">
            <span className="animate-x text-[clamp(3rem,10vh,7rem)] font-black text-hot drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">✕</span>
          </div>
        ) : null}
      </div>
      <div className={`max-w-[18rem] truncate text-center text-3xl font-black ${winner ? "" : "line-through opacity-70"}`}>{item ? itemName(item, lang) : t("common.tbd")}</div>
      <div className={`text-4xl font-black ${side === "a" ? "text-brand" : "text-brand-2"}`}>{votes}</div>
    </div>
  );
}

/**
 * The one broadcast page (/overlay, with /show as an alias). Runs the automatic
 * show sequence: category vote -> bracket -> match -> bracket -> result -> ...
 * Designed to sit in the middle band of a vertical canvas over the camera.
 */

export function Broadcast({ state }: { state: SessionState | null }): ReactNode {
  const { t, lang, round } = useI18n();
  const show = state?.show;
  useSound(state);

  if (!state || !show) {
    return (
      <div className="overlay-root grid h-screen place-items-center bg-ink text-white/50">
        <p>{t("common.connecting")}</p>
      </div>
    );
  }

  const category = activeCategory(state);
  const match = activeMatch(state);
  const banner = state.tournament ?? null;
  const themeRound = match?.round ?? (show.champion ? "final" : "r16");

  let body: ReactNode;

  if (show.phase === "category") {
    body = (
      <div key="category" className="animate-view-in flex h-full w-full items-center justify-center p-4">
        <CategoryPoll state={state} />
      </div>
    );
  } else if (show.phase === "round-intro" && match) {
    body = (
      <div key="round-intro" className="flex h-full w-full flex-col items-center justify-center gap-3">
        <div className="text-sm font-bold uppercase tracking-[0.4em] text-[color:var(--round)]">
          {t("show.phase.round-intro")}
        </div>
        <h1 className="animate-round-pop text-center text-[clamp(2.5rem,11vh,6.5rem)] font-black tracking-tight text-[color:var(--round)]">
          {round(match.round)}
        </h1>
        <div className="h-1 w-40 rounded-full bg-[color:var(--round)]" />
      </div>
    );
  } else if (show.phase === "bracket-intro" || show.phase === "bracket-outro") {
    body = (
      <div key={show.phase} className="animate-view-in h-full w-full">
        <BracketCinema state={state} mode={show.phase === "bracket-intro" ? "intro" : "outro"} />
      </div>
    );
  } else if (show.phase === "round-recap") {
    body = (
      <div key="round-recap" className="animate-view-in h-full w-full">
        <BracketCinema state={state} mode="recap" />
      </div>
    );
  } else if (show.phase === "match") {
    body = (
      <div key="match" className="flex h-full w-full items-center justify-center p-2">
        <div className="animate-match-in flex h-full w-full flex-col rounded-2xl border border-line/60 bg-ink/90 p-3 shadow-2xl backdrop-blur-sm">
          <Stage state={state} variant="overlay" />
        </div>
      </div>
    );
  } else if (show.phase === "result" && show.result) {
    const result = show.result;
    const a = getItem(category, result.a);
    const b = getItem(category, result.b);
    const winner = getItem(category, result.winner);
    body = (
      <PhaseFrame animKey="result">
        <h1 className="text-3xl font-black text-brand">{t("show.resultTitle")}</h1>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <ResultSide item={a} votes={result.votesA} winner={result.winner === result.a} side="a" lang={lang} />
          <div className="text-2xl font-black text-white/30">VS</div>
          <ResultSide item={b} votes={result.votesB} winner={result.winner === result.b} side="b" lang={lang} />
        </div>
        <div className="text-2xl font-black text-[color:var(--round)]">
          {t("show.winner")}: {winner ? itemName(winner, lang) : t("common.tbd")}
        </div>
        {show.champion ? <TopSupporters supporters={state.live.supporters} /> : null}
      </PhaseFrame>
    );
  } else if (show.phase === "champion") {
    body = (
      <div key="champion" className="animate-shake relative flex h-full w-full flex-col items-center justify-center gap-6 p-6">
        <div className="animate-flash pointer-events-none absolute inset-0 bg-white" />
        <ChampionCard state={state} />
        <TopSupporters supporters={state.live.supporters} />
      </div>
    );
  } else if (banner && match) {
    // Show isn't running, but a match is live: mirror the Control room view so the
    // overlay is useful without starting the automatic show.
    body = (
      <div key="live" className="flex h-full w-full items-center justify-center p-2">
        <div className="animate-match-in flex h-full w-full flex-col rounded-2xl border border-line/60 bg-ink/90 p-3 shadow-2xl backdrop-blur-sm">
          <Stage state={state} variant="overlay" />
        </div>
      </div>
    );
  } else {
    body = (
      <PhaseFrame animKey="idle">
        <h1 className="text-3xl font-black text-white/90">{t("show.idleTitle")}</h1>
        <p className="text-lg font-bold text-white/75">{t("show.idleHint")}</p>
      </PhaseFrame>
    );
  }

  const phaseChip = show.phase !== "idle" ? t(`show.phase.${show.phase}` as TKey) : null;

  return (
    <div
      className={`overlay-root round-${themeRound} relative h-screen w-full overflow-hidden text-white`}
      style={{ backgroundColor: state.settings.showBackground }}
    >
      {body}
      <VoteToasts votes={state.live.recentVotes} />
      <SoundUnlock settings={state.settings.sound} />
      {phaseChip ? (
        <div className="pointer-events-none absolute end-4 top-4 flex items-center gap-2">
          {show.paused ? <span className="chip border-hot text-hot">{t("show.paused")}</span> : null}
          <span className="chip text-white/50">{phaseChip}</span>
        </div>
      ) : null}
    </div>
  );
}

function ChampionCard({ state }: { state: SessionState }): ReactNode {
  const { t, lang } = useI18n();
  const category = activeCategory(state);
  const champion: Item | null = getItem(category, state.show.champion);
  return (
    <div className="animate-slam flex flex-col items-center gap-5 text-center">
      <div className="chip border-[color:var(--round)] text-[color:var(--round)]">
        {t("stage.championOf", { category: categoryName(category, lang) })}
      </div>
      <div className="h-[clamp(9rem,24vh,16rem)] w-[clamp(9rem,24vh,16rem)] overflow-hidden rounded-3xl shadow-[0_0_80px_-10px_var(--round)] ring-4 ring-[color:var(--round)]">
        <ItemVisual item={champion} className="h-full w-full" emojiClassName="text-[clamp(3.5rem,12vh,8rem)]" />
      </div>
      <h1 className="text-[clamp(2rem,7vh,4.5rem)] font-black tracking-tight text-[color:var(--round)]">
        {champion ? itemName(champion, lang) : t("common.tbd")}
      </h1>
      <p className="text-white/60">{t("stage.wins")}</p>
    </div>
  );
}
