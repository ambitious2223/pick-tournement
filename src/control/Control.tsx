import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Panel, Toggle } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { MatchControls } from "./MatchControls.tsx";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { QueueEditor } from "./QueueEditor.tsx";
import { BracketBoard } from "../overlay/BracketBoard.tsx";
import { activeCategory, activeMatch } from "../lib/selectors.ts";

export function Control({ state }: { state: SessionState | null }): ReactNode {
  if (!state) return <p className="text-white/50">Connecting to the server…</p>;

  const match = activeMatch(state);
  const category = activeCategory(state);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <MatchControls state={state} />
        <SettingsPanel settings={state.settings} />
        <Panel title="Simulator">
          <Toggle
            label="Simulated crowd (no TikTok needed)"
            checked={state.simulated}
            onChange={(on) => void send("sim:set", { on })}
          />
          <p className="mt-2 text-xs text-white/50">
            Fires fake chat + gift votes at the live match so you can rehearse a full tournament offline.
          </p>
        </Panel>
      </div>

      <div className="flex flex-col gap-5">
        <QueueEditor state={state} />
        <Panel title="Bracket">
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
        </Panel>
      </div>
    </div>
  );
}
