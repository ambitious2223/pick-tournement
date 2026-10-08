import type { ReactNode } from "react";
import type { SessionState, SoundSettings } from "../../shared/types.ts";
import { Toggle } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { useI18n } from "../i18n/index.tsx";
import { CUE_IDS } from "../sound/cues.ts";
import { sound } from "../sound/manager.ts";
import { MusicLibrary } from "../sound/MusicLibrary.tsx";

const patch = (p: Partial<SoundSettings>): void => void send("sound:update", p);

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }): ReactNode {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0 text-white/50">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-1 flex-1 cursor-pointer accent-brand"
      />
      <span className="w-8 shrink-0 text-end text-white/40">{Math.round(value * 100)}</span>
    </label>
  );
}

export function SoundPanel({ state }: { state: SessionState }): ReactNode {
  const { t } = useI18n();
  const s: SoundSettings = state.settings.sound;

  const toggleCue = (id: string) =>
    patch({ disabledCues: s.disabledCues.includes(id) ? s.disabledCues.filter((x) => x !== id) : [...s.disabledCues, id] });

  const preview = (id: string) => {
    void sound.unlock().then(() => {
      sound.setConfig(s);
      sound.play(id);
    });
  };
  const previewAll = () => {
    void sound.unlock().then(() => {
      sound.setConfig(s);
      CUE_IDS.forEach((id, i) => window.setTimeout(() => sound.play(id), i * 550));
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <Toggle label={t("sound.muted")} checked={s.muted} onChange={(v) => patch({ muted: v })} />
      <Slider label={t("sound.master")} value={s.master} onChange={(v) => patch({ master: v })} />
      <Slider label={t("sound.music")} value={s.music} onChange={(v) => patch({ music: v })} />
      <Slider label={t("sound.sfx")} value={s.sfx} onChange={(v) => patch({ sfx: v })} />
      <Slider label={t("sound.voice")} value={s.voice} onChange={(v) => patch({ voice: v })} />
      <Toggle label={t("sound.musicEnabled")} checked={s.musicEnabled} onChange={(v) => patch({ musicEnabled: v })} />

      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sound.cues")}</span>
        <button type="button" onClick={previewAll} className="rounded-md border border-line px-2 py-0.5 text-[0.65rem] text-white/60 hover:border-brand">
          {t("sound.previewAll")}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {CUE_IDS.map((id) => {
          const off = s.disabledCues.includes(id);
          return (
            <div key={id} className={`flex items-center gap-1 rounded-md border px-1.5 py-1 text-[0.62rem] ${off ? "border-line bg-ink-2/40 opacity-50" : "border-line bg-ink-2"}`}>
              <button type="button" onClick={() => toggleCue(id)} className="min-w-0 flex-1 truncate text-start" title={id}>
                {id}
              </button>
              <button type="button" onClick={() => preview(id)} className="shrink-0 text-white/50 hover:text-brand" title={t("sound.preview")}>
                ▶
              </button>
            </div>
          );
        })}
      </div>

      <MusicLibrary settings={s} showVolume />

      <p className="text-[0.7rem] leading-relaxed text-white/40">{t("sound.hint")}</p>
    </div>
  );
}
