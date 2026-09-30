import { useEffect, type ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Toggle } from "../ui/primitives.tsx";
import { Collapsible } from "../ui/Collapsible.tsx";
import { send } from "../lib/live.ts";
import { MatchControls } from "./MatchControls.tsx";
import { ShowControls } from "./ShowControls.tsx";
import { SoundControls } from "./SoundControls.tsx";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { QueueEditor } from "./QueueEditor.tsx";
import { MatchStage } from "../bracket/MatchStage.tsx";
import { useI18n } from "../i18n/index.tsx";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function Control({ state }: { state: SessionState | null }): ReactNode {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          if (state?.status === "running") void send("match:pause", undefined);
          else if (state?.status === "paused") void send("match:resume", undefined);
          else void send("match:start", undefined);
          break;
        case "n":
          void send("tournament:next", undefined);
          break;
        case "l":
          void send("match:forceWinner", "a");
          break;
        case "r":
          void send("match:forceWinner", "b");
          break;
        case "b":
          void send("view:set", "bracket");
          break;
        case "m":
          void send("view:set", "match");
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state?.status]);

  if (!state) return <p className="text-white/50">{t("common.connecting")}</p>;

  return (
    <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[1fr_19rem]">
      <section className="panel flex min-h-[420px] flex-col overflow-hidden xl:min-h-0">
        <MatchStage state={state} variant="control" />
      </section>

      <aside className="scroll-thin flex flex-col gap-3 xl:min-h-0 xl:overflow-y-auto xl:pe-1">
        <div className="flex items-center gap-2 px-1 text-[0.65rem] text-white/45">
          <span className={`h-2 w-2 rounded-full ${state.live.connected ? "bg-lime" : "bg-hot"}`} />
          <span>{t("live.title")}: {state.live.connected ? t("live.connected") : t("live.disconnected")}</span>
        </div>
        <MatchControls state={state} />
        <ShowControls state={state} />
        <SoundControls state={state} />
        <Collapsible title={t("control.settings")}>
          <SettingsPanel settings={state.settings} />
        </Collapsible>
        <Collapsible title={t("control.queue")} hint={state.queue.length ? String(state.queue.length) : undefined}>
          <QueueEditor state={state} />
        </Collapsible>
        <Collapsible title={t("control.simulator")} hint={state.simulated ? t("control.simHintOn") : undefined}>
          <Toggle
            label={t("control.simulatorToggle")}
            checked={state.simulated}
            onChange={(on) => void send("sim:set", { on })}
          />
          <p className="mt-2 text-xs text-white/50">{t("control.simulatorHelp")}</p>
        </Collapsible>
        <p className="px-1 text-[0.65rem] leading-relaxed text-white/35">{t("control.shortcuts")}</p>
      </aside>
    </div>
  );
}
