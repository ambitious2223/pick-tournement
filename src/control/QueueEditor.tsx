import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Panel, Button, Select } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";

export function QueueEditor({ state }: { state: SessionState }): ReactNode {
  const queue = state.queue;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= queue.length) return;
    const next = [...queue];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    void send("queue:set", next);
  };

  return (
    <Panel title="Tournament queue (combinations)">
      <div className="mb-3 flex gap-2">
        <Select
          className="flex-1"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              void send("queue:add", e.target.value);
              e.target.value = "";
            }
          }}
        >
          <option value="">Add a category…</option>
          {state.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {queue.length === 0 ? (
        <p className="text-sm text-white/50">
          Queue is empty. Start a category directly and it will run once.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {queue.map((entry, i) => {
            const category = state.categories.find((c) => c.id === entry.categoryId);
            const current = i === state.queueIndex;
            return (
              <li
                key={`${entry.categoryId}-${i}`}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  current ? "border-brand bg-brand/10" : "border-line bg-ink-2"
                }`}
              >
                <span className="w-5 text-white/40">{i + 1}</span>
                <span className="flex-1 truncate">{category?.name ?? entry.categoryId}</span>
                {current ? <span className="chip border-brand text-brand">live</span> : null}
                <Button onClick={() => move(i, i - 1)} className="px-2 py-1">
                  ↑
                </Button>
                <Button onClick={() => move(i, i + 1)} className="px-2 py-1">
                  ↓
                </Button>
                <Button variant="danger" onClick={() => void send("queue:remove", i)} className="px-2 py-1">
                  ✕
                </Button>
              </li>
            );
          })}
        </ol>
      )}

      <Button variant="ghost" className="mt-3 w-full" onClick={() => void send("queue:set", [])}>
        Clear queue
      </Button>
    </Panel>
  );
}
