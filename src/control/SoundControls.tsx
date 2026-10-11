import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { SessionState, SoundSettings } from "../../shared/types.ts";
import { Toggle, Button } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { CUE_IDS } from "../sound/cues.ts";
import { sound } from "../sound/manager.ts";
import { MusicLibrary } from "../sound/MusicLibrary.tsx";
import { SoundStatusLine, enableSound } from "../sound/SoundStatus.tsx";
import { useI18n, type TKey } from "../i18n/index.tsx";

const patch = (p: Partial<SoundSettings>): void => void send("sound:update", p);

const GROUPS: { key: TKey; cues: string[] }[] = [
  { key: "sound.grp.category", cues: ["category.start", "category.vote", "category.winner"] },
  { key: "sound.grp.round", cues: ["round.intro"] },
  {
    key: "sound.grp.bracket",
    cues: ["bracket.intro", "bracket.focus", "bracket.zoom.in", "bracket.reveal", "bracket.loser", "bracket.tension", "bracket.outro", "bracket.winner"],
  },
  { key: "sound.grp.match", cues: ["match.countdown", "match.start", "match.tick", "match.suddenDeath", "match.end"] },
  { key: "sound.grp.votes", cues: ["vote.chat", "vote.gift.small", "vote.gift.medium", "vote.gift.large", "vote.lead"] },
  { key: "sound.grp.result", cues: ["result.win", "result.lose"] },
  { key: "sound.grp.champion", cues: ["champion.win", "champion.reveal", "champion.supporter"] },
  { key: "sound.grp.live", cues: ["live.like", "live.follow", "live.share", "live.subscribe", "live.member"] },
];

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
  const [custom, setCustom] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadCustom = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/sounds", { cache: "no-store" });
      const list = res.ok ? ((await res.json()) as string[]) : [];
      setCustom(new Set(list.map((n) => n.replace(/\.[a-z0-9]+$/i, ""))));
    } catch {
      setCustom(new Set());
    }
  }, []);

  useEffect(() => {
    void loadCustom();
  }, [loadCustom]);

  const flash = (text: string): void => {
    setMsg(text);
    window.setTimeout(() => setMsg(null), 4000);
  };

  const toggleCue = (id: string): void =>
    patch({ disabledCues: s.disabledCues.includes(id) ? s.disabledCues.filter((x) => x !== id) : [...s.disabledCues, id] });

  const preview = (id: string): void => {
    sound.setConfig(s);
    void sound
      .unlock()
      .then(() => sound.play(id))
      .catch(() => undefined);
  };

  const upload = async (id: string, file: File | undefined): Promise<void> => {
    if (!file) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/sounds/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": file.type || "audio/mpeg" },
        body: file,
      });
      if (!res.ok) throw new Error("upload failed");
      await sound.refreshOverrides();
      await loadCustom();
      flash(`${id}: ${t("sound.uploaded")}`);
      preview(id);
    } catch {
      flash(`${id}: ${t("sound.uploadFailed")}`);
    } finally {
      setBusy(null);
    }
  };

  const reset = async (id: string): Promise<void> => {
    setBusy(id);
    try {
      await fetch(`/api/sounds/${encodeURIComponent(id)}`, { method: "DELETE" });
      await sound.refreshOverrides();
      await loadCustom();
      preview(id);
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  const row = (id: string): ReactNode => {
    const off = s.disabledCues.includes(id);
    const isCustom = custom.has(id);
    return (
      <div
        key={id}
        className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[0.65rem] ${
          off ? "border-line bg-ink-2/40 opacity-50" : "border-line bg-ink-2"
        }`}
      >
        <button type="button" onClick={() => toggleCue(id)} className="min-w-0 flex-1 truncate text-start" title={id}>
          {id}
        </button>
        <span className={`shrink-0 rounded px-1 py-0.5 text-[0.55rem] ${isCustom ? "bg-brand/20 text-brand" : "text-white/30"}`}>
          {isCustom ? t("sound.customBadge") : t("sound.builtinBadge")}
        </span>
        <button type="button" onClick={() => preview(id)} className="shrink-0 text-white/50 hover:text-brand" title={t("sound.preview")}>
          ▶
        </button>
        <label
          className="shrink-0 cursor-pointer text-white/50 hover:text-brand"
          title={isCustom ? t("sound.replace") : t("sound.upload")}
        >
          {busy === id ? "…" : "⬆"}
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/x-wav,audio/webm,audio/mp4,audio/x-m4a,.mp3,.ogg,.wav,.webm,.m4a"
            className="hidden"
            onChange={(e) => {
              void upload(id, e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {isCustom ? (
          <button type="button" onClick={() => void reset(id)} className="shrink-0 text-white/50 hover:text-hot" title={t("sound.resetBuiltin")}>
            ↺
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <section className="panel flex flex-col gap-3 p-3">
      <div className="text-[0.7rem] font-bold uppercase tracking-widest text-brand">{t("sound.title")}</div>
      <SoundStatusLine settings={s} />
      <Toggle label={t("sound.muted")} checked={s.muted} onChange={(v) => patch({ muted: v })} />
      <Toggle label={t("sound.musicEnabled")} checked={s.musicEnabled} onChange={(v) => patch({ musicEnabled: v })} />
      <div className="flex flex-col gap-1.5">
        <Slider label={t("sound.master")} value={s.master} onChange={(v) => patch({ master: v })} />
        <Slider label={t("sound.music")} value={s.music} onChange={(v) => patch({ music: v })} />
        <Slider label={t("sound.sfx")} value={s.sfx} onChange={(v) => patch({ sfx: v })} />
        <Slider label={t("sound.voice")} value={s.voice} onChange={(v) => patch({ voice: v })} />
      </div>

      <MusicLibrary settings={s} showVolume />

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-line/60 pt-3">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("sound.cuesTitle")}</span>
        <Button variant="ghost" className="px-2 py-0.5 text-[0.65rem]" onClick={() => void enableSound(s)}>
          {t("sound.test")}
        </Button>
      </div>
      {msg ? <p className="text-[0.65rem] text-lime">{msg}</p> : null}

      <div className="flex flex-col gap-3">
        {GROUPS.map((group) => {
          const cues = group.cues.filter((id) => CUE_IDS.includes(id));
          if (cues.length === 0) return null;
          return (
            <div key={group.key} className="flex flex-col gap-1">
              <div className="text-[0.6rem] font-bold uppercase tracking-widest text-white/35">{t(group.key)}</div>
              {cues.map((id) => row(id))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
