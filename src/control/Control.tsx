import { useEffect, useState, type ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Toggle, Panel } from "../ui/primitives.tsx";
import { Tabs, type TabItem } from "../ui/Tabs.tsx";
import { send } from "../lib/live.ts";
import { MatchControls } from "./MatchControls.tsx";
import { ShowControls } from "./ShowControls.tsx";
import { SoundControls } from "./SoundControls.tsx";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { QueueEditor } from "./QueueEditor.tsx";
import { ContentPanel } from "./ContentPanel.tsx";
import { MatchStage } from "../bracket/MatchStage.tsx";
import { useI18n } from "../i18n/index.tsx";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

type ControlTab = "run" | "show" | "sound" | "settings" | "queue" | "sim" | "content";

const CONTROL_TABS: readonly ControlTab[] = ["run", "show", "sound", "settings", "queue", "sim", "content"];

function readTab(): ControlTab {
  try {
    const saved = window.localStorage.getItem("pl.control.tab");
    if (saved && (CONTROL_TABS as readonly string[]).includes(saved)) return saved as ControlTab;
  } catch {
    // ignore storage errors (private mode, etc.)
  }
  return "run";
}

export function Control({ state }: { state: SessionState | null }): ReactNode {
  const { t } = useI18n();
  const [tab, setTab] = useState<ControlTab>(readTab);

  useEffect(() => {
    try {
      window.localStorage.setItem("pl.control.tab", tab);
    } catch {
      // ignore storage errors
    }
  }, [tab]);

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

  const tabs: TabItem<ControlTab>[] = [
    { id: "run", label: t("control.run") },
    { id: "show", label: t("control.show") },
    { id: "sound", label: t("control.sound") },
    { id: "settings", label: t("control.settings") },
    { id: "queue", label: t("control.queue"), hint: state.queue.length ? String(state.queue.length) : undefined },
    { id: "sim", label: t("control.simulator"), hint: state.simulated ? "•" : undefined },
    { id: "content", label: t("control.content") },
  ];

  return (
    <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[1fr_19rem]">
      <section className="panel flex min-h-[420px] flex-col overflow-hidden xl:min-h-0">
        <MatchStage state={state} variant="control" />
      </section>

      <aside className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center gap-2 px-1 text-[0.65rem] text-white/45">
          <span className={`h-2 w-2 rounded-full ${state.live.connected ? "bg-lime" : "bg-hot"}`} />
          <span>{t("live.title")}: {state.live.connected ? t("live.connected") : t("live.disconnected")}</span>
        </div>

        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        <div className="scroll-thin max-h-[65vh] min-h-0 flex-1 overflow-y-auto pe-1 xl:max-h-none">
          {tab === "run" ? <MatchControls state={state} /> : null}
          {tab === "show" ? <ShowControls state={state} /> : null}
          {tab === "sound" ? <SoundControls state={state} /> : null}
          {tab === "content" ? <ContentPanel state={state} /> : null}
          {tab === "settings" ? (
            <Panel title={t("control.settings")}>
              <SettingsPanel settings={state.settings} />
            </Panel>
          ) : null}
          {tab === "queue" ? (
            <Panel title={t("control.queue")}>
              <QueueEditor state={state} />
            </Panel>
          ) : null}
          {tab === "sim" ? (
            <Panel title={t("control.simulator")}>
              <Toggle
                label={t("control.simulatorToggle")}
                checked={state.simulated}
                onChange={(on) => void send("sim:set", { on })}
              />
              <p className="mt-2 text-xs text-white/50">{t("control.simulatorHelp")}</p>
            </Panel>
          ) : null}
        </div>

        <p className="px-1 text-[0.65rem] leading-relaxed text-white/35">{t("control.shortcuts")}</p>
      </aside>
    </div>
  );
}
