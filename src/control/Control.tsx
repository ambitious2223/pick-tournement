import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Toggle } from "../ui/primitives.tsx";
import { Collapsible } from "../ui/Collapsible.tsx";
import { send } from "../lib/live.ts";
import { MatchControls } from "./MatchControls.tsx";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { QueueEditor } from "./QueueEditor.tsx";
import { BracketBoard } from "../overlay/BracketBoard.tsx";
import { Stage } from "../stage/Stage.tsx";
import { activeCategory, activeMatch } from "../lib/selectors.ts";

export function Control({ state }: { state: SessionState | null }): ReactNode {
  if (!state) return <p className="text-white/50">Connecting to the server…</p>;

  const match = activeMatch(state);
  const category = activeCategory(state);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_19rem]">
      <div className="flex flex-col gap-4">
        <section className="panel p-6">
          <Stage state={state} variant="control" />
        </section>
        <Collapsible title="Bracket">
          {state.tournament && match ? (
            <BracketBoard
              bracket={state.tournament.bracket}
              category={category}
              currentRound={match.round}
              currentIndex={match.index}
            />
          ) : (
            <p className="text-sm text-white/50">Start a category to see the bracket.</p>
          )}
        </Collapsible>
      </div>

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
