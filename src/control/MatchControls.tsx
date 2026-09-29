import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Button, Select } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { activeCategory, activeMatch } from "../lib/selectors.ts";

const SM = "px-2 py-1 text-xs";

export function MatchControls({ state }: { state: SessionState }): ReactNode {
  const category = activeCategory(state);
  const match = activeMatch(state);
  const running = state.status === "running";
  const paused = state.status === "paused";

  return (
    <section className="panel flex flex-col gap-2 p-3">
      <div className="text-[0.7rem] font-bold uppercase tracking-widest text-brand">Run</div>

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

      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" className={SM} onClick={() => void send("tournament:start", undefined)}>
          Start / restart
        </Button>
        <Button variant="ghost" className={SM} onClick={() => void send("tournament:next", undefined)}>
          Next category
        </Button>
      </div>

      {match && category ? (
        <div className="text-[0.7rem] text-white/50">
          {category.name} · {state.status}
          {state.simulated ? " · simulator on" : ""}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <Button variant="lime" className={SM} disabled={!paused} onClick={() => void send("match:resume", undefined)}>
          Resume
        </Button>
        <Button variant="ghost" className={SM} disabled={!running} onClick={() => void send("match:pause", undefined)}>
          Pause
        </Button>
        <Button variant="hot" className={SM} disabled={!match} onClick={() => void send("match:skip", undefined)}>
          Skip
        </Button>
        <Button variant="ghost" className={SM} disabled={!running} onClick={() => void send("match:extend", 10)}>
          +10s
        </Button>
        <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:forceWinner", "a")}>
          Force L
        </Button>
        <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:forceWinner", "b")}>
          Force R
        </Button>
      </div>
    </section>
  );
}
