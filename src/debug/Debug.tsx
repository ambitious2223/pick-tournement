import { useState, type ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { ROUND_ORDER, ROUND_LABELS } from "../../shared/config.ts";
import { Button, Field, TextInput, Select } from "../ui/primitives.tsx";
import { Collapsible } from "../ui/Collapsible.tsx";
import { send } from "../lib/live.ts";
import { activeCategory, activeItems, activeMatch } from "../lib/selectors.ts";
import { fakeViewer } from "../../engine/simulate.ts";

const SM = "px-2 py-1 text-xs";

export function Debug({ state }: { state: SessionState | null }): ReactNode {
  const [text, setText] = useState("");
  const [viewer, setViewer] = useState("host_test");
  const [giftId, setGiftId] = useState("rose");
  const [burst, setBurst] = useState(20);
  const [round, setRound] = useState("r16");
  const [index, setIndex] = useState(0);
  const [imgTest, setImgTest] = useState<string[]>([]);

  if (!state) return <p className="text-white/50">Connecting…</p>;

  const match = activeMatch(state);
  const category = activeCategory(state);
  const { a, b } = activeItems(state);

  const testImages = async () => {
    const urls = [a?.image, b?.image].filter((u): u is string => Boolean(u));
    if (urls.length === 0) {
      setImgTest(["current match has no photo for either side"]);
      return;
    }
    const results = await Promise.all(
      urls.map(
        (u) =>
          new Promise<string>((resolve) => {
            const img = new Image();
            img.addEventListener("load", () => resolve(`OK  ${u}  (${img.naturalWidth}x${img.naturalHeight})`), { once: true });
            img.addEventListener("error", () => resolve(`FAIL ${u}  (could not load)`), { once: true });
            img.src = u;
          }),
      ),
    );
    setImgTest(results);
  };

  const sendBurst = async () => {
    for (let i = 0; i < burst; i++) {
      const name = Math.random() < 0.5 ? a?.name : b?.name;
      if (name) await send("vote:chat", { text: name, viewer: fakeViewer(Math.random) });
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="flex flex-col gap-3">
        <Collapsible title="Vote injector" defaultOpen>
          <div className="flex flex-col gap-2">
            <Field label="Chat message">
              <TextInput className={SM} value={text} onChange={(e) => setText(e.target.value)} placeholder={a?.name ?? "name"} />
            </Field>
            <Field label="Viewer">
              <TextInput className={SM} value={viewer} onChange={(e) => setViewer(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" className={SM} onClick={() => void send("vote:chat", { text: text || a?.name || "", viewer })}>
                Chat vote
              </Button>
              <Button variant="hot" className={SM} onClick={() => void send("vote:gift", { giftId, viewer, count: 1 })}>
                Gift vote
              </Button>
            </div>
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <Field label="Gift id">
                <TextInput className={SM} value={giftId} onChange={(e) => setGiftId(e.target.value)} />
              </Field>
              <Field label="Burst">
                <TextInput className={SM} type="number" min={1} value={burst} onChange={(e) => setBurst(Number(e.target.value))} />
              </Field>
            </div>
            <Button variant="lime" className={SM} disabled={!match} onClick={() => void sendBurst()}>
              Simulate {burst} voters
            </Button>
          </div>
        </Collapsible>

        <Collapsible title="Force outcomes" defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:forceWinner", "a")}>
              Force left
            </Button>
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:forceWinner", "b")}>
              Force right
            </Button>
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:skip", undefined)}>
              Skip / resolve
            </Button>
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:extend", 30)}>
              Extend +30s
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_4rem_auto] gap-2">
            <Select className={SM} value={round} onChange={(e) => setRound(e.target.value)}>
              {ROUND_ORDER.map((r) => (
                <option key={r} value={r}>
                  {ROUND_LABELS[r]}
                </option>
              ))}
            </Select>
            <TextInput className={SM} type="number" min={0} value={index} onChange={(e) => setIndex(Number(e.target.value))} />
            <Button variant="primary" className={SM} disabled={!state.tournament} onClick={() => void send("match:jump", { round: round as never, index })}>
              Jump
            </Button>
          </div>
        </Collapsible>

        <Collapsible title="Photos" defaultOpen>
          <div className="flex flex-col gap-2 text-xs">
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {state.categories.map((c) => {
                const have = c.items.filter((i) => i.image).length;
                return (
                  <div key={c.id} className="flex justify-between gap-2">
                    <span className="truncate text-white/60">{c.name}</span>
                    <span className={have > 0 ? "text-lime" : "text-hot"}>
                      {have}/{c.items.length}
                    </span>
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" className={SM} onClick={() => void testImages()}>
              Test current match images
            </Button>
            {imgTest.length > 0 ? (
              <div className="scroll-thin max-h-24 overflow-auto font-mono text-[0.7rem] text-white/70">
                {imgTest.map((line, i) => (
                  <div key={i} className={line.startsWith("FAIL") ? "text-hot" : "text-lime"}>
                    {line}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Collapsible>

        <Collapsible title="Danger zone">
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" className={SM} onClick={() => void send("session:reset", undefined)}>
              Reset session
            </Button>
            <Button variant="ghost" className={SM} onClick={() => void fetch("/api/uploads/clear", { method: "POST" })}>
              Clear uploads
            </Button>
            <Button variant="ghost" className={SM} onClick={() => void fetch("/api/seed?force=1", { method: "POST" })}>
              Reseed categories
            </Button>
          </div>
        </Collapsible>
      </div>

      <Collapsible title="Current match" defaultOpen>
        {match && category ? (
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="truncate">
                A: {a?.name ?? "—"} · <span className="text-brand">{match.votesA}</span>
              </span>
              <span className="truncate text-right">
                <span className="text-brand-2">{match.votesB}</span> · {b?.name ?? "—"} :B
              </span>
            </div>
            <div className="text-white/50">
              voters A: {match.votersA.join(", ") || "none"}
              <br />
              voters B: {match.votersB.join(", ") || "none"}
            </div>
          </div>
        ) : (
          <p className="text-xs text-white/50">No live match.</p>
        )}
      </Collapsible>

      <div className="flex flex-col gap-3">
        <Collapsible title="Event log" defaultOpen>
          <div className="scroll-thin max-h-72 overflow-auto font-mono text-[0.7rem]">
            {state.log.toReversed().map((entry, i) => (
              <div key={i} className="border-b border-line/40 py-0.5">
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
        </Collapsible>

        <Collapsible title="Raw state">
          <pre className="scroll-thin max-h-72 overflow-auto rounded-lg bg-ink-2 p-2 text-[0.7rem] text-white/70">
            {JSON.stringify(state, null, 2)}
          </pre>
        </Collapsible>
      </div>
    </div>
  );
}
