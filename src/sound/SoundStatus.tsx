import { useEffect, useState, type ReactNode } from "react";
import type { SoundSettings } from "../../shared/types.ts";
import { send } from "../lib/live.ts";
import { useI18n } from "../i18n/index.tsx";
import { sound, type SoundStatus } from "./manager.ts";

/** Polls the audio manager so screens can show whether sound is actually live. */
export function useSoundStatus(): SoundStatus {
  const [status, setStatus] = useState<SoundStatus>(() => sound.status());
  useEffect(() => {
    const id = window.setInterval(() => setStatus(sound.status()), 500);
    return () => window.clearInterval(id);
  }, []);
  return status;
}

/**
 * Turns the light on: clears mute, unlocks the audio context (a real click is
 * the browser's requirement) and plays a test cue. Returns whether it is live.
 */
export async function enableSound(settings: SoundSettings): Promise<boolean> {
  if (settings.muted) void send("sound:update", { muted: false });
  await sound.unlock();
  const live = { ...settings, muted: false };
  sound.setConfig(live);
  sound.play("champion.win");
  return sound.status().context === "running";
}

/**
 * A one-line, plain-language health readout for the sound system. If sound is
 * muted or the browser has blocked it, it shows a loud warning and a button
 * that unmutes, unlocks and tests in one click.
 */
export function SoundStatusLine({ settings }: { settings: SoundSettings }): ReactNode {
  const { t } = useI18n();
  const status = useSoundStatus();
  const [busy, setBusy] = useState(false);

  const live = status.context === "running" && !status.muted;
  const tone = live ? "text-lime border-lime/40 bg-lime/10" : "text-hot border-hot/50 bg-hot/10";

  const contextLabel =
    status.context === "running"
      ? t("sound.ctxRunning")
      : status.context === "not started"
        ? t("sound.ctxNotStarted")
        : t("sound.ctxSuspended");

  const turnOn = async (): Promise<void> => {
    setBusy(true);
    try {
      await enableSound(settings);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 rounded-lg border px-2.5 py-2 text-[0.7rem] ${tone}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${live ? "bg-lime" : "bg-hot"}`} />
        <span className="min-w-0 flex-1 font-semibold">
          {status.muted
            ? t("sound.mutedBanner")
            : live
              ? t("sound.statusOn", { context: contextLabel })
              : t("sound.statusBlocked")}
        </span>
      </div>
      {live ? (
        <span className="truncate text-white/45">
          {status.lastCue ? t("sound.lastCue", { cue: status.lastCue }) : t("sound.noCueYet")}
        </span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void turnOn()}
          className="self-start rounded-md border border-hot/60 bg-hot px-2.5 py-1 font-bold text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? t("sound.enabling") : t("sound.turnOn")}
        </button>
      )}
    </div>
  );
}
