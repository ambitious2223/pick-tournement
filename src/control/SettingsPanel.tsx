import { useEffect, useRef, type ReactNode } from "react";
import type { SessionState, Settings } from "../../shared/types.ts";
import { Field, TextInput, Select, Slider } from "../ui/primitives.tsx";
import { Collapsible } from "../ui/Collapsible.tsx";
import { ColorWheel } from "../ui/ColorWheel.tsx";
import { SoundAdvanced } from "./SoundControls.tsx";
import { ShowTuning } from "./ShowTuning.tsx";
import { send } from "../lib/live.ts";
import { useI18n } from "../i18n/index.tsx";

const patch = (p: Partial<Settings>): void => void send("settings:update", p);

export function SettingsPanel({
  state,
  initialOpen = null,
}: {
  state: SessionState;
  initialOpen?: "appearance" | "advanced" | null;
}): ReactNode {
  const { t } = useI18n();
  const settings = state.settings;
  const appearanceRef = useRef<HTMLDivElement | null>(null);
  const advancedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!initialOpen) return;
    const timer = window.setTimeout(() => {
      const target = initialOpen === "advanced" ? advancedRef.current : appearanceRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [initialOpen]);

  return (
    <div className="flex flex-col gap-3">
      <div data-tour="settings-timings" className="grid grid-cols-2 gap-2">
        <div data-tour="round-presets">
          <Field label={t("settings.roundSeconds")}>
            <TextInput type="number" min={5} value={settings.roundSeconds} onChange={(e) => patch({ roundSeconds: Number(e.target.value) })} className="px-2 py-1 text-xs" />
          </Field>
        </div>
        <Field label={t("settings.suddenDeath")}>
          <TextInput type="number" min={1} value={settings.suddenDeathSeconds} onChange={(e) => patch({ suddenDeathSeconds: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
        <Field label={t("settings.chatWeight")}>
          <TextInput type="number" min={1} value={settings.chatWeight} onChange={(e) => patch({ chatWeight: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
        <div data-tour="power-ups-key">
          <Field label={t("settings.giftWeight")}>
            <TextInput type="number" min={1} value={settings.giftWeight} onChange={(e) => patch({ giftWeight: Number(e.target.value) })} className="px-2 py-1 text-xs" />
          </Field>
        </div>
      </div>
      <Field label={t("settings.tieRule")}>
        <Select value={settings.tieRule} onChange={(e) => patch({ tieRule: e.target.value as Settings["tieRule"] })} className="px-2 py-1 text-xs">
          <option value="sudden-death">{t("settings.tie.sudden")}</option>
          <option value="random">{t("settings.tie.random")}</option>
          <option value="higher-seed">{t("settings.tie.seed")}</option>
        </Select>
      </Field>
      <Slider
        label={t("settings.stageTextScale")}
        min={0.6}
        max={2.5}
        step={0.05}
        value={settings.stageTextScale}
        onChange={(v) => patch({ stageTextScale: v })}
        display={(v) => `${Math.round(v * 100)}%`}
      />

      <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("settings.showTimings")}</div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("settings.categorySeconds")}>
          <TextInput type="number" min={3} value={settings.categorySeconds} onChange={(e) => patch({ categorySeconds: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
        <Field label={t("settings.roundIntroSeconds")}>
          <TextInput type="number" min={1} value={settings.roundIntroSeconds} onChange={(e) => patch({ roundIntroSeconds: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
        <Field label={t("settings.bracketIntroSeconds")}>
          <TextInput type="number" min={1} value={settings.bracketIntroSeconds} onChange={(e) => patch({ bracketIntroSeconds: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
        <Field label={t("settings.bracketOutroSeconds")}>
          <TextInput type="number" min={1} value={settings.bracketOutroSeconds} onChange={(e) => patch({ bracketOutroSeconds: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
        <Field label={t("settings.resultSeconds")}>
          <TextInput type="number" min={1} value={settings.resultSeconds} onChange={(e) => patch({ resultSeconds: Number(e.target.value) })} className="px-2 py-1 text-xs" />
        </Field>
      </div>

      <div ref={appearanceRef} data-tour="style-background">
        <Collapsible
          title={t("settings.appearance")}
          hint={settings.showBackground.toUpperCase()}
          persistKey="settings.appearance"
          forceOpen={initialOpen === "appearance"}
        >
          <ColorWheel
            color={settings.showBackground}
            onChange={(hex) => void send("settings:update", { showBackground: hex })}
          />
          <div className="mt-3 flex items-center justify-between text-[0.65rem] text-white/45">
            <span>{t("settings.showBackground")}</span>
            <span className="h-4 w-10 rounded border border-line" style={{ background: settings.showBackground }} />
          </div>
        </Collapsible>
      </div>

      <div ref={advancedRef} data-tour="settings-advanced">
        <Collapsible
          title={t("settings.advanced")}
          persistKey="settings.advanced"
          forceOpen={initialOpen === "advanced"}
        >
          <div className="flex flex-col gap-3">
            <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sound.filesTitle")}</div>
            <SoundAdvanced state={state} />

            <div className="mt-1 border-t border-line/60 pt-3">
              <div className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("settings.showLook")}</div>
              <ShowTuning settings={settings} />
            </div>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
