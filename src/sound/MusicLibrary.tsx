import type { ReactNode } from "react";
import type { SoundSettings } from "../../shared/types.ts";
import { send } from "../lib/live.ts";
import { sound } from "./manager.ts";
import { AUTO_TRACK, MUSIC_BY_ID, MUSIC_IDS } from "./music.ts";
import { useI18n } from "../i18n/index.tsx";

const patch = (p: Partial<SoundSettings>): void => void send("sound:update", p);

interface MusicLibraryProps {
  settings: SoundSettings;
  showVolume?: boolean;
}

export function MusicLibrary({ settings, showVolume = false }: MusicLibraryProps): ReactNode {
  const { t, lang } = useI18n();
  const active = settings.musicTrack || AUTO_TRACK;

  const pick = (id: string): void => {
    patch({ musicTrack: id });
    if (id === AUTO_TRACK) {
      sound.setMusic(null);
      return;
    }
    void sound.unlock().then(() => {
      sound.setConfig(settings);
      sound.setMusic(id);
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sound.tracks")}</div>
      <button
        type="button"
        onClick={() => pick(AUTO_TRACK)}
        className={`rounded-md border px-2 py-1.5 text-start text-[0.68rem] ${
          active === AUTO_TRACK ? "border-brand bg-brand/10 text-white" : "border-line bg-ink-2 text-white/70 hover:border-brand"
        }`}
      >
        {t("sound.auto")}
      </button>

      {MUSIC_IDS.map((id) => {
        const track = MUSIC_BY_ID[id];
        if (!track) return null;
        const isActive = active === id;
        const name = lang === "ar" ? track.nameAr : track.name;
        const genre = lang === "ar" ? track.genreAr : track.genre;
        return (
          <div
            key={id}
            className={`rounded-md border px-2 py-1 ${isActive ? "border-brand bg-brand/10" : "border-line bg-ink-2"}`}
          >
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => pick(id)} className="min-w-0 flex-1 text-start" title={id}>
                <span className={`block truncate text-[0.68rem] font-semibold ${isActive ? "text-white" : "text-white/85"}`}>
                  {name}
                </span>
                <span className="block truncate text-[0.58rem] text-white/45">
                  {genre} · {track.bpm} BPM
                </span>
              </button>
              <span className={`shrink-0 text-[0.6rem] ${isActive ? "text-brand" : "text-white/25"}`} aria-hidden="true">
                {isActive ? "●" : "○"}
              </span>
            </div>
            {showVolume ? (
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((settings.trackVolume[id] ?? 1) * 100)}
                onChange={(e) =>
                  patch({ trackVolume: { ...settings.trackVolume, [id]: Number(e.target.value) / 100 } })
                }
                className="mt-1 h-1 w-full cursor-pointer accent-brand"
              />
            ) : null}
          </div>
        );
      })}

      <p className="text-[0.65rem] leading-relaxed text-white/40">{t("sound.pickHint")}</p>
    </div>
  );
}
