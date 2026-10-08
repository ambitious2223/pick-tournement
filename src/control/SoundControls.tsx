import type { ReactNode } from "react";
import type { SessionState, SoundSettings } from "../../shared/types.ts";
import { Toggle, Button } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { sound } from "../sound/manager.ts";
import { MusicLibrary } from "../sound/MusicLibrary.tsx";
import { useI18n } from "../i18n/index.tsx";

const patch = (p: Partial<SoundSettings>): void => void send("sound:update", p);

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }): ReactNode {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-12 shrink-0 text-white/50">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-1 flex-1 cursor-pointer accent-brand"
      />
    </label>
  );
}

export function SoundControls({ state }: { state: SessionState }): ReactNode {
  const { t } = useI18n();
  const s: SoundSettings = state.settings.sound;
  return (
    <section className="panel flex flex-col gap-2 p-3">
      <div className="text-[0.7rem] font-bold uppercase tracking-widest text-brand">{t("sound.title")}</div>
      <Toggle label={t("sound.muted")} checked={s.muted} onChange={(v) => patch({ muted: v })} />
      <Toggle label={t("sound.musicEnabled")} checked={s.musicEnabled} onChange={(v) => patch({ musicEnabled: v })} />
      <Slider label={t("sound.music")} value={s.music} onChange={(v) => patch({ music: v })} />
      <Slider label={t("sound.sfx")} value={s.sfx} onChange={(v) => patch({ sfx: v })} />
      <MusicLibrary settings={s} />
      <Button
        variant="ghost"
        className="px-2 py-1 text-xs"
        onClick={() => {
          void sound.unlock().then(() => {
            sound.setConfig(s);
            sound.play("champion.win");
          });
        }}
      >
        {t("sound.test")}
      </Button>
    </section>
  );
}
