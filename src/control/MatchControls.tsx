import { useEffect, useState, type ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Button, Select } from "../ui/primitives.tsx";
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

  // The dropdown only selects; pressing Start launches the selection.
  const [selected, setSelected] = useState(state.tournament?.categoryId ?? "");
  useEffect(() => {
    if (state.tournament?.categoryId) setSelected(state.tournament.categoryId);
  }, [state.tournament?.categoryId]);

  return (
    <section className="panel flex flex-col gap-2 p-3">
      <div className="text-[0.7rem] font-bold uppercase tracking-widest text-brand">{t("control.run")}</div>

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

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="primary"
          className={SM}
          onClick={() => void send("tournament:start", selected ? { categoryId: selected } : undefined)}
        >
          {t("control.start")}
        </Button>
        <Button variant="ghost" className={SM} onClick={() => void send("tournament:next", undefined)}>
          {t("control.nextCategory")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="lime"
          className={SM}
          title={t("control.demo1Title")}
          onClick={() => void send("demo:start", { seconds: 2, single: true })}
        >
          {t("control.demo1")}
        </Button>
        <Button
          variant="hot"
          className={SM}
          title={t("control.demoAllTitle")}
          onClick={() => void send("demo:start", { seconds: 2 })}
        >
          {t("control.demoAll")}
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
    </section>
  );
}
