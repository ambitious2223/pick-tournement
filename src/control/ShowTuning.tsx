import type { ReactNode } from "react";
import type { Settings } from "../../shared/types.ts";
import { estimateShowSchedule } from "../../shared/config.ts";
import { Slider, Toggle } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { useI18n, type TKey } from "../i18n/index.tsx";

const patch = (p: Partial<Settings>): void => void send("settings:update", p);

/** "2m 15s" / "45s" — compact runtime formatting. */
function fmt(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * The show's visual tuning. Kept behind Settings → Advanced so the everyday
 * screen stays simple, but still available without editing code.
 */
export function ShowTuning({ settings }: { settings: Settings }): ReactNode {
  const { t } = useI18n();
  const s = settings;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="mb-1 text-[0.6rem] leading-relaxed text-white/40">{t("sim.advancedHint")}</p>

      <Slider
        label={t("sim.stageSize")}
        min={0.6}
        max={1.4}
        step={0.05}
        value={s.stageScale}
        onChange={(v) => patch({ stageScale: v })}
        display={(v) => `${Math.round(v * 100)}%`}
      />
      <Slider
        label={t("settings.bracketPace")}
        min={0.6}
        max={1.8}
        step={0.05}
        value={s.bracketPace ?? 1}
        onChange={(v) => patch({ bracketPace: v })}
        display={(v) => `${Math.round(v * 100)}%`}
      />
      <Slider
        label={t("sim.bracketZoom")}
        min={1.5}
        max={5}
        step={0.1}
        value={s.bracketZoom}
        onChange={(v) => patch({ bracketZoom: v })}
        display={(v) => `${v.toFixed(1)}×`}
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

      <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sim.bracketToggles")}</div>
      <Toggle label={t("sim.showIntro")} checked={s.showBracketIntro} onChange={(v) => patch({ showBracketIntro: v })} />
      <Toggle label={t("sim.showOutro")} checked={s.showBracketOutro} onChange={(v) => patch({ showBracketOutro: v })} />
      <Toggle label={t("sim.showRecap")} checked={s.showRoundRecap} onChange={(v) => patch({ showRoundRecap: v })} />
      <Toggle label={t("sim.controlCinematic")} checked={s.controlCinematic} onChange={(v) => patch({ controlCinematic: v })} />

      <Timeline settings={s} />
    </div>
  );
}

/** The estimated phase list for one full 16-item tournament, with a total. */
function Timeline({ settings }: { settings: Settings }): ReactNode {
  const { t } = useI18n();
  const { phases, totalSeconds } = estimateShowSchedule(settings);
  return (
    <div className="mt-1 border-t border-line/60 pt-3">
      <div className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("timeline.title")}</div>
      <ul className="flex flex-col gap-1">
        {phases
          .filter((phase) => phase.count > 0 && phase.seconds > 0)
          .map((phase) => (
            <li key={phase.key} className="flex items-center justify-between text-xs text-white/70">
              <span>
                {t(`timeline.${phase.key}` as TKey)}
                <span className="ms-1 text-white/35">{t("timeline.times", { n: phase.count })}</span>
              </span>
              <span className="font-mono text-white/90">{fmt(phase.seconds)}</span>
            </li>
          ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-sm font-black text-brand">
        <span>{t("timeline.total")}</span>
        <span className="font-mono">{fmt(totalSeconds)}</span>
      </div>
    </div>
  );
}
