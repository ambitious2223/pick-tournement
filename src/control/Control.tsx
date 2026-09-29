import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Toggle } from "../ui/primitives.tsx";
import { Collapsible } from "../ui/Collapsible.tsx";
import { send } from "../lib/live.ts";
import { MatchControls } from "./MatchControls.tsx";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { QueueEditor } from "./QueueEditor.tsx";
import { MatchStage } from "../bracket/MatchStage.tsx";

export function Control({ state }: { state: SessionState | null }): ReactNode {
  if (!state) return <p className="text-white/50">Connecting to the server…</p>;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_19rem]">
      <section className="panel overflow-hidden">
        <MatchStage state={state} variant="control" />
      </section>

      <aside className="flex flex-col gap-3 xl:sticky xl:top-16 xl:self-start">
        <MatchControls state={state} />
        <Collapsible title="Settings">
          <SettingsPanel settings={state.settings} />
        </Collapsible>
        <Collapsible title="Queue" hint={state.queue.length ? String(state.queue.length) : undefined}>
          <QueueEditor state={state} />
        </Collapsible>
        <Collapsible title="Simulator" hint={state.simulated ? "on" : undefined}>
          <Toggle
            label="Simulated crowd (no TikTok needed)"
            checked={state.simulated}
            onChange={(on) => void send("sim:set", { on })}
          />
          <p className="mt-2 text-xs text-white/50">
            Fires fake chat + gift votes at the live match so you can rehearse a full tournament offline.
          </p>
        </Collapsible>
      </aside>
    </div>
  );
}
