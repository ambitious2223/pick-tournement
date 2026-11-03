import { useEffect, useState, type ReactNode } from "react";
import type { Category, SessionState } from "../../shared/types.ts";
import { Button, Select } from "../ui/primitives.tsx";
import { Collapsible } from "../ui/Collapsible.tsx";
import { RunToggles } from "./RunToggles.tsx";
import { send } from "../lib/live.ts";
import { activeCategory, activeMatch, categoryName } from "../lib/selectors.ts";
import { useI18n, type TKey } from "../i18n/index.tsx";

const SM = "px-2 py-1 text-xs";

export function MatchControls({ state }: { state: SessionState }): ReactNode {
  const { t, lang } = useI18n();
  const category = activeCategory(state);
  const match = activeMatch(state);
  const running = state.status === "running";
  const paused = state.status === "paused";
  const pollRunning = state.show.active && state.show.phase === "category";
  const show = state.show;
  const pollIds = state.show.categoryCandidates.length
    ? state.show.categoryCandidates
    : state.categories.map((c) => c.id);
  const standings = pollIds
    .map((id) => ({ cat: state.categories.find((c) => c.id === id) ?? null, votes: state.show.categoryVotes[id] ?? 0 }))
    .filter((entry): entry is { cat: Category; votes: number } => entry.cat !== null)
    .toSorted((a, b) => b.votes - a.votes);

  // The dropdown only selects; pressing Start launches the selection.
  const [selected, setSelected] = useState(state.tournament?.categoryId ?? "");
  useEffect(() => {
    if (state.tournament?.categoryId) setSelected(state.tournament.categoryId);
  }, [state.tournament?.categoryId]);

  return (
    <section className="panel flex flex-col gap-2 p-3">
      <div className="text-[0.7rem] font-bold uppercase tracking-widest text-brand">{t("control.run")}</div>

      <div data-tour="battle-primary" className="rounded-lg border border-line bg-ink-2/60 p-2">
        <div className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("run.showTitle")}</div>
        <div className="grid grid-cols-2 gap-2">
          {show.active ? (
            <Button
              variant="danger"
              className={SM}
              onClick={() => {
                if (window.confirm(t("show.confirmStop"))) void send("show:stop", undefined);
              }}
            >
              {t("show.stop")}
            </Button>
          ) : (
            <Button variant="primary" className={SM} onClick={() => void send("show:start", undefined)}>
              {t("show.start")}
            </Button>
          )}
          <Button
            variant="ghost"
            className={SM}
            disabled={!show.active}
            onClick={() => void send(show.paused ? "show:resume" : "show:pause", undefined)}
          >
            {show.paused ? t("show.resume") : t("show.pause")}
          </Button>
        </div>
        <Button
          variant="hot"
          className="mt-2 w-full px-2 py-1 text-xs"
          disabled={!show.active}
          onClick={() => void send("show:skipPhase", undefined)}
        >
          {t("show.skip")}
        </Button>
        <div className="mt-1.5 text-[0.7rem] text-white/50">
          {show.active ? (
            <>
              {t(`show.phase.${show.phase}` as TKey)}
              {show.paused ? ` · ${t("show.paused")}` : ""}
            </>
          ) : (
            t("show.autoHint")
          )}
        </div>
      </div>

      {pollRunning ? (
        <Button variant="hot" className="py-2 text-base" onClick={() => void send("poll:stop", undefined)}>
          {t("poll.running")}
        </Button>
      ) : (
        <Button
          variant="lime"
          data-tour="poll-button"
          className="py-2 text-base"
          onClick={() => {
            if (state.tournament && !window.confirm(t("poll.confirmReplace"))) return;
            void send("poll:start", undefined);
          }}
        >
          {t("poll.button")}
        </Button>
      )}

      <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">{t("control.pickCategory")}</option>
        {state.categories.map((c) => (
          <option key={c.id} value={c.id}>
            {categoryName(c, lang)}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="primary"
          data-tour="match-start"
          className={SM}
          onClick={() => void send("tournament:start", selected ? { categoryId: selected } : undefined)}
        >
          {t("control.start")}
        </Button>
        <Button variant="ghost" className={SM} onClick={() => void send("tournament:next", undefined)}>
          {t("control.nextCategory")}
        </Button>
      </div>

      {match && category ? (
        <div className="text-[0.7rem] text-white/50">
          {t("control.statusLine", { category: categoryName(category, lang), status: t(`status.${state.status}` as TKey) })}
          {state.simulated ? t("control.simOn") : ""}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <Button variant="lime" className={SM} disabled={!paused} onClick={() => void send("match:resume", undefined)}>
          {t("control.resume")}
        </Button>
        <Button variant="ghost" className={SM} disabled={!running} onClick={() => void send("match:pause", undefined)}>
          {t("control.pause")}
        </Button>
        <Button variant="hot" className={SM} disabled={!match} onClick={() => void send("match:skip", undefined)}>
          {t("control.skip")}
        </Button>
      </div>

      <RunToggles settings={state.settings} />

      <Collapsible title={t("run.advanced")} persistKey="run.advanced">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={state.stageView === "bracket" ? "primary" : "ghost"}
              className={SM}
              onClick={() => void send("view:set", "bracket")}
            >
              {t("control.bracketView")}
            </Button>
            <Button
              variant={state.stageView === "match" ? "primary" : "ghost"}
              className={SM}
              onClick={() => void send("view:set", "match")}
            >
              {t("control.matchView")}
            </Button>
          </div>
          <div data-tour="winner-controls" className="grid grid-cols-3 gap-2">
            <Button variant="ghost" className={SM} disabled={!running} onClick={() => void send("match:extend", 10)}>
              {t("control.extend")}
            </Button>
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:forceWinner", "a")}>
              {t("control.forceL")}
            </Button>
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:forceWinner", "b")}>
              {t("control.forceR")}
            </Button>
          </div>
          <Button
            variant="danger"
            className={SM}
            onClick={() => {
              if (window.confirm(t("control.confirmReset"))) {
                void send("session:reset", undefined);
              }
            }}
          >
            {t("control.stopReset")}
          </Button>
        </div>
      </Collapsible>

      {pollRunning ? (
        <div className="flex flex-col gap-1 text-xs">
          <div className="font-bold uppercase tracking-widest text-white/50">{t("poll.standings")}</div>
          {standings.map((entry) => (
            <div key={entry.cat.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-white/70">{categoryName(entry.cat, lang)}</span>
              <span className="shrink-0 font-bold text-brand">{t("poll.votes", { n: entry.votes })}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
