import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { estimateShowSchedule } from "../../shared/config.ts";
import { Button, Slider, Toggle } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { useI18n } from "../i18n/index.tsx";

const SM = "px-2 py-1 text-xs";

const patch = (p: Partial<SessionState["settings"]>): void => void send("settings:update", p);

/** "2m 15s" / "45s" — compact runtime formatting. */
function fmt(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Practice mode only: the simulated crowd, its speed and the one-tap demos.
 * The show itself is started from Run; the visual tuning lives in Settings.
 */
export function SimControls({ state }: { state: SessionState }): ReactNode {
  const { t } = useI18n();
  const s = state.settings;
  const { totalSeconds } = estimateShowSchedule(s);

  return (
    <div className="flex flex-col gap-3">
      <Toggle label={t("control.simulatorToggle")} checked={state.simulated} onChange={(on) => void send("sim:set", { on })} />
      <p className="text-xs text-white/50">{t("control.simulatorHelp")}</p>

      <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sim.volume")}</div>
      <Slider
        label={t("sim.votesPerTick")}
        min={1}
        max={10}
        step={1}
        value={s.simVotesPerTick}
        onChange={(v) => patch({ simVotesPerTick: v })}
        display={(v) => String(v)}
      />
      <Slider
        label={t("sim.tickSpeed")}
        min={200}
        max={2000}
        step={100}
        value={s.simIntervalMs}
        onChange={(v) => patch({ simIntervalMs: v })}
        display={(v) => `${v}ms`}
      />
      <Slider
        label={t("sim.giftChance")}
        min={0}
        max={0.5}
        step={0.01}
        value={s.simGiftChance}
        onChange={(v) => patch({ simGiftChance: v })}
        display={(v) => `${Math.round(v * 100)}%`}
      />

      <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sim.practice")}</div>
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
        variant="primary"
        className={SM}
        title={t("control.rehearsalTitle")}
        onClick={() => void send("rehearsal:start", undefined)}
      >
        {t("control.rehearsal")}
      </Button>

      <div className="mt-1 flex items-center justify-between border-t border-line/60 pt-2 text-sm font-black text-brand">
        <span>{t("timeline.total")}</span>
        <span className="font-mono">{fmt(totalSeconds)}</span>
      </div>
      <p className="text-[0.6rem] leading-relaxed text-white/40">{t("sim.advancedMoved")}</p>
    </div>
  );
}
