import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Button, Slider, Toggle } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { useI18n } from "../i18n/index.tsx";

const SM = "px-2 py-1 text-xs";

const patch = (p: Partial<SessionState["settings"]>): void => void send("settings:update", p);

/**
 * Everything you need to run the show by itself: the simulator, its speed and
 * volume, start/stop for the automatic show, the one-tap demos, plus the stage
 * size and bracket pacing so the whole run can be tuned without editing code.
 */
export function SimControls({ state }: { state: SessionState }): ReactNode {
  const { t } = useI18n();
  const s = state.settings;
  const show = state.show;

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

      <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sim.show")}</div>
      <div className="grid grid-cols-2 gap-2">
        {show.active ? (
          <Button variant="danger" className={SM} onClick={() => void send("show:stop", undefined)}>
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

      <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sim.stage")}</div>
      <Slider
        label={t("sim.stageSize")}
        min={0.6}
        max={1.4}
        step={0.05}
        value={s.stageScale}
        onChange={(v) => patch({ stageScale: v })}
        display={(v) => `${Math.round(v * 100)}%`}
      />

      <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sim.pacing")}</div>
      <Slider
        label={t("settings.bracketPace")}
        min={0.6}
        max={1.8}
        step={0.05}
        value={s.bracketPace}
        onChange={(v) => patch({ bracketPace: v })}
        display={(v) => `${Math.round(v * 100)}%`}
      />
      <Slider
        label={t("sim.intro")}
        min={1}
        max={12}
        step={1}
        value={s.bracketIntroSeconds}
        onChange={(v) => patch({ bracketIntroSeconds: v })}
        display={(v) => `${v}s`}
      />
      <Slider
        label={t("sim.outro")}
        min={1}
        max={15}
        step={1}
        value={s.bracketOutroSeconds}
        onChange={(v) => patch({ bracketOutroSeconds: v })}
        display={(v) => `${v}s`}
      />
      <Slider
        label={t("sim.recap")}
        min={1}
        max={12}
        step={1}
        value={s.roundRecapSeconds}
        onChange={(v) => patch({ roundRecapSeconds: v })}
        display={(v) => `${v}s`}
      />
    </div>
  );
}
