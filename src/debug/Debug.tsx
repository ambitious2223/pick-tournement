import { useState, type ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { ROUND_ORDER, ROUND_LABELS } from "../../shared/config.ts";
import { Panel, Button, Field, TextInput, Select } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { activeCategory, activeItems, activeMatch } from "../lib/selectors.ts";
import { fakeViewer } from "../../engine/simulate.ts";

export function Debug({ state }: { state: SessionState | null }): ReactNode {
  const [text, setText] = useState("");
  const [viewer, setViewer] = useState("host_test");
  const [giftId, setGiftId] = useState("rose");
  const [burst, setBurst] = useState(20);
  const [round, setRound] = useState("r16");
  const [index, setIndex] = useState(0);

  if (!state) return <p className="text-white/50">Connecting…</p>;

  const match = activeMatch(state);
  const category = activeCategory(state);
  const { a, b } = activeItems(state);

  const sendBurst = async () => {
    for (let i = 0; i < burst; i++) {
      const name = Math.random() < 0.5 ? a?.name : b?.name;
      if (name) await send("vote:chat", { text: name, viewer: fakeViewer(Math.random) });
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Panel title="Vote injector">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Chat message">
              <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder={a?.name ?? "name"} />
            </Field>
            <Field label="Viewer">
              <TextInput value={viewer} onChange={(e) => setViewer(e.target.value)} />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="primary"
              onClick={() => void send("vote:chat", { text: text || a?.name || "", viewer })}
            >
              Send chat vote
            </Button>
            <Button
              variant="hot"
              onClick={() => void send("vote:gift", { giftId, viewer, count: 1 })}
            >
              Send gift vote
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Gift id">
              <TextInput value={giftId} onChange={(e) => setGiftId(e.target.value)} />
            </Field>
            <Field label="Burst voters">
              <TextInput type="number" min={1} value={burst} onChange={(e) => setBurst(Number(e.target.value))} />
            </Field>
          </div>
          <Button variant="lime" className="mt-3 w-full" onClick={() => void sendBurst()} disabled={!match}>
            Simulate {burst} voters now
          </Button>
        </Panel>

        <Panel title="Force outcomes">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" disabled={!match} onClick={() => void send("match:forceWinner", "a")}>
              Force left (A)
            </Button>
            <Button variant="ghost" disabled={!match} onClick={() => void send("match:forceWinner", "b")}>
              Force right (B)
            </Button>
            <Button variant="ghost" disabled={!match} onClick={() => void send("match:skip", undefined)}>
              Skip timer (resolve)
            </Button>
            <Button variant="ghost" disabled={!match} onClick={() => void send("match:extend", 30)}>
              Extend +30s
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_5rem_auto] gap-2">
            <Select value={round} onChange={(e) => setRound(e.target.value)}>
              {ROUND_ORDER.map((r) => (
                <option key={r} value={r}>
                  {ROUND_LABELS[r]}
                </option>
              ))}
            </Select>
            <TextInput type="number" min={0} value={index} onChange={(e) => setIndex(Number(e.target.value))} />
            <Button variant="primary" disabled={!state.tournament} onClick={() => void send("match:jump", { round: round as never, index })}>
              Jump
            </Button>
          </div>
        </Panel>

        <Panel title="Danger zone">
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={() => void send("session:reset", undefined)}>
              Reset session
            </Button>
            <Button variant="ghost" onClick={() => void fetch("/api/uploads/clear", { method: "POST" })}>
              Clear uploads
            </Button>
            <Button variant="ghost" onClick={() => void fetch("/api/seed?force=1", { method: "POST" })}>
              Reseed categories (force)
            </Button>
          </div>
          <p className="mt-2 text-xs text-white/50">
            Reseed overwrites the ten built-in categories only; custom categories stay.
          </p>
        </Panel>
      </div>

      <div className="flex flex-col gap-5">
        <Panel title="Current match">
          {match && category ? (
            <div className="text-sm">
              <div className="flex justify-between">
                <span>
                  A: {a?.name ?? "—"} · votes {match.votesA}
                </span>
                <span>
                  B: {b?.name ?? "—"} · votes {match.votesB}
                </span>
              </div>
              <div className="mt-2 text-xs text-white/50">
                voters A: {match.votersA.join(", ") || "none"}
                <br />
                voters B: {match.votersB.join(", ") || "none"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/50">No live match.</p>
          )}
        </Panel>

        <Panel title="Event log">
          <div className="scroll-thin max-h-64 overflow-auto font-mono text-xs">
            {state.log.toReversed().map((entry, i) => (
              <div key={i} className="border-b border-line/40 py-1">
                <span className="text-white/40">{new Date(entry.at).toLocaleTimeString()} </span>
                <span
                  className={
                    entry.kind === "error"
                      ? "text-hot"
                      : entry.kind === "vote"
                        ? "text-brand"
                        : entry.kind === "round"
                          ? "text-lime"
                          : "text-white/70"
                  }
                >
                  [{entry.kind}]
                </span>{" "}
                {entry.message}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Raw state">
          <pre className="scroll-thin max-h-64 overflow-auto rounded-lg bg-ink-2 p-3 text-xs text-white/70">
            {JSON.stringify(state, null, 2)}
          </pre>
        </Panel>
      </div>
    </div>
  );
}
