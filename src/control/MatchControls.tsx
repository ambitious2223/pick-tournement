import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { ROUND_LABELS } from "../../shared/config.ts";
import { Panel, Button, Select } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { activeCategory, activeItems, activeMatch } from "../lib/selectors.ts";

export function MatchControls({ state }: { state: SessionState }): ReactNode {
  const category = activeCategory(state);
  const match = activeMatch(state);
  const { a, b } = activeItems(state);
  const running = state.status === "running";
  const paused = state.status === "paused";

  return (
    <Panel title="Match controls">
      <div className="mb-4 flex items-center gap-3">
        <Select
          value={state.tournament?.categoryId ?? ""}
          onChange={(e) => {
            if (e.target.value) void send("tournament:start", { categoryId: e.target.value });
          }}
        >
          <option value="">Pick a category…</option>
          {state.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Button variant="primary" onClick={() => void send("tournament:start", undefined)}>
          Start / restart
        </Button>
        <Button variant="ghost" onClick={() => void send("tournament:next", undefined)}>
          Next category
        </Button>
      </div>

      {match && category ? (
        <div className="mb-4 rounded-lg border border-line bg-ink-2 p-3">
          <div className="text-xs uppercase tracking-widest text-brand">
            {ROUND_LABELS[match.round]} · match {match.index + 1}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm font-semibold">
            <span className="flex-1 truncate">
              {a?.name ?? "TBD"} <span className="text-brand">{match.votesA}</span>
            </span>
            <span className="text-white/30">vs</span>
            <span className="flex-1 truncate text-right">
              <span className="text-brand-2">{match.votesB}</span> {b?.name ?? "TBD"}
            </span>
          </div>
          <div className="mt-1 text-xs text-white/50">
            {category.name} · status {state.status}
            {state.simulated ? " · SIMULATOR ON" : ""}
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-white/50">No tournament running.</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Button variant="lime" disabled={!paused} onClick={() => void send("match:resume", undefined)}>
          ▶ Resume
        </Button>
        <Button variant="ghost" disabled={!running} onClick={() => void send("match:pause", undefined)}>
          ⏸ Pause
        </Button>
        <Button variant="hot" disabled={!match} onClick={() => void send("match:skip", undefined)}>
          ⏭ Skip / resolve
        </Button>
        <Button variant="ghost" disabled={!running} onClick={() => void send("match:extend", 10)}>
          +10 seconds
        </Button>
        <Button variant="ghost" disabled={!match} onClick={() => void send("match:forceWinner", "a")}>
          Force left
        </Button>
        <Button variant="ghost" disabled={!match} onClick={() => void send("match:forceWinner", "b")}>
          Force right
        </Button>
      </div>
    </Panel>
  );
}
