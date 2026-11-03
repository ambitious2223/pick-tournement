import { useEffect, useState, type ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Panel } from "../ui/primitives.tsx";
import { Tabs, type TabItem } from "../ui/Tabs.tsx";
import { send } from "../lib/live.ts";
import { MatchControls } from "./MatchControls.tsx";
import { SoundQuickControls } from "./SoundControls.tsx";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { SimControls } from "./SimControls.tsx";
import { QueueEditor } from "./QueueEditor.tsx";
import { MatchStage } from "../bracket/MatchStage.tsx";
import { CategoryPoll } from "../overlay/CategoryPoll.tsx";
import { useI18n } from "../i18n/index.tsx";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export type PanelTab = "run" | "settings" | "queue" | "sim";

type SettingsSection = "appearance" | "advanced";

function readSettingsSection(): SettingsSection | null {
  const open = new URLSearchParams(window.location.search).get("open");
  return open === "appearance" || open === "advanced" ? open : null;
}

export function Control({
  state,
  activeTab,
  onTabChange,
}: {
  state: SessionState | null;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
}): ReactNode {
  const { t } = useI18n();
  const [settingsSection] = useState<SettingsSection | null>(readSettingsSection);

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

  const tabs: TabItem<PanelTab>[] = [
    { id: "run", label: t("control.run") },
    { id: "settings", label: t("control.settings") },
    { id: "queue", label: t("control.queue"), hint: state.queue.length ? String(state.queue.length) : undefined },
    { id: "sim", label: t("control.simulator"), hint: state.simulated ? "�?�" : undefined },
  ];

  return (
    <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[1fr_19rem]">
      <section
        className="panel flex min-h-[420px] flex-col overflow-hidden transition-colors duration-300 xl:min-h-0"
        style={{ backgroundColor: state.settings.showBackground }}
      >
        {state.show.active && state.show.phase === "category" ? (
          <div className="scroll-thin h-full w-full overflow-auto">
            <CategoryPoll state={state} />
          </div>
        ) : (
          <MatchStage state={state} variant="control" />
        )}
      </section>

      <aside className="flex min-h-0 flex-col gap-3">
        <Tabs tabs={tabs} value={activeTab} onChange={onTabChange} />

        <div className="scroll-thin max-h-[65vh] min-h-0 flex-1 overflow-y-auto pe-1 xl:max-h-none">
          {activeTab === "run" ? (
            <div className="flex flex-col gap-3">
              <MatchControls state={state} />
              <SoundQuickControls state={state} />
            </div>
          ) : null}
          {activeTab === "settings" ? (
            <Panel title={t("control.settings")}>
              <SettingsPanel state={state} initialOpen={settingsSection} />
            </Panel>
          ) : null}
          {activeTab === "queue" ? (
            <Panel title={t("control.queue")}>
              <QueueEditor state={state} />
            </Panel>
          ) : null}
          {activeTab === "sim" ? (
            <Panel title={t("control.simulator")}>
              <SimControls state={state} />
            </Panel>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
