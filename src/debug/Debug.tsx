import { useState, type ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { ROUND_ORDER } from "../../shared/config.ts";
import { Button, Field, TextInput, Select, Slider } from "../ui/primitives.tsx";
import { Collapsible } from "../ui/Collapsible.tsx";
import { LivePanel } from "./LivePanel.tsx";
import { SoundPanel } from "./SoundPanel.tsx";
import { send } from "../lib/live.ts";
import { activeCategory, activeItems, activeMatch, categoryName } from "../lib/selectors.ts";
import { fakeViewer } from "../../engine/simulate.ts";
import { useI18n } from "../i18n/index.tsx";

const SM = "px-2 py-1 text-xs";

export function Debug({ state }: { state: SessionState | null }): ReactNode {
  const { t, round, lang } = useI18n();
  const [text, setText] = useState("");
  const [viewer, setViewer] = useState("host_test");
  const [giftId, setGiftId] = useState("rose");
  const [burst, setBurst] = useState(20);
  const [roundId, setRoundId] = useState("r16");
  const [index, setIndex] = useState(0);
  const [imgTest, setImgTest] = useState<string[]>([]);

  if (!state) return <p className="text-white/50">{t("common.connecting")}</p>;

  const match = activeMatch(state);
  const category = activeCategory(state);
  const { a, b } = activeItems(state);

  const testImages = async () => {
    const urls = [a?.image, b?.image].filter((u): u is string => Boolean(u));
    if (urls.length === 0) {
      setImgTest([t("debug.noPhoto")]);
      return;
    }
    const results = await Promise.all(
      urls.map(
        (u) =>
          new Promise<string>((resolve) => {
            const img = new Image();
            img.addEventListener("load", () => resolve(t("debug.imgOk", { url: u, w: img.naturalWidth, h: img.naturalHeight })), { once: true });
            img.addEventListener("error", () => resolve(t("debug.imgFail", { url: u })), { once: true });
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
    <div className="grid min-w-0 gap-3 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-3">
        <Collapsible title={t("live.title")} defaultOpen hint={state.live.connected ? t("live.connected") : undefined}>
          <LivePanel state={state} />
        </Collapsible>

        <Collapsible title={t("sound.title")}>
          <SoundPanel state={state} />
        </Collapsible>

        <Collapsible title={t("debug.display")} defaultOpen>
          <Slider
            label={t("settings.stageTextScale")}
            min={0.6}
            max={2.5}
            step={0.05}
            value={state.settings.stageTextScale}
            onChange={(v) => void send("settings:update", { stageTextScale: v })}
            display={(v) => `${Math.round(v * 100)}%`}
          />
          <p className="mt-2 text-xs text-white/50">{t("debug.displayHelp")}</p>
        </Collapsible>

        <Collapsible title={t("debug.voteInjector")} defaultOpen>
          <div className="flex flex-col gap-2">
            <Field label={t("debug.chatMessage")}>
              <TextInput className={SM} value={text} onChange={(e) => setText(e.target.value)} placeholder={a?.name ?? t("debug.chatPlaceholder")} />
            </Field>
            <Field label={t("debug.viewer")}>
              <TextInput className={SM} value={viewer} onChange={(e) => setViewer(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" className={SM} onClick={() => void send("vote:chat", { text: text || a?.name || "", viewer })}>
                {t("debug.chatVote")}
              </Button>
              <Button variant="hot" className={SM} onClick={() => void send("vote:gift", { giftId, viewer, count: 1 })}>
                {t("debug.giftVote")}
              </Button>
            </div>
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <Field label={t("debug.giftId")}>
                <TextInput className={SM} value={giftId} onChange={(e) => setGiftId(e.target.value)} />
              </Field>
              <Field label={t("debug.burst")}>
                <TextInput className={SM} type="number" min={1} value={burst} onChange={(e) => setBurst(Number(e.target.value))} />
              </Field>
            </div>
            <Button variant="lime" className={SM} disabled={!match} onClick={() => void sendBurst()}>
              {t("debug.simulateVoters", { n: burst })}
            </Button>
          </div>
        </Collapsible>

        <Collapsible title={t("debug.forceOutcomes")} defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:forceWinner", "a")}>
              {t("debug.forceLeft")}
            </Button>
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:forceWinner", "b")}>
              {t("debug.forceRight")}
            </Button>
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:skip", undefined)}>
              {t("debug.skipResolve")}
            </Button>
            <Button variant="ghost" className={SM} disabled={!match} onClick={() => void send("match:extend", 30)}>
              {t("debug.extend30")}
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_4rem_auto] gap-2">
            <Select className={SM} value={roundId} onChange={(e) => setRoundId(e.target.value)}>
              {ROUND_ORDER.map((r) => (
                <option key={r} value={r}>
                  {round(r)}
                </option>
              ))}
            </Select>
            <TextInput className={SM} type="number" min={0} value={index} onChange={(e) => setIndex(Number(e.target.value))} />
            <Button variant="primary" className={SM} disabled={!state.tournament} onClick={() => void send("match:jump", { round: roundId as never, index })}>
              {t("debug.jump")}
            </Button>
          </div>
        </Collapsible>

        <Collapsible title={t("debug.photos")} defaultOpen>
          <div className="flex flex-col gap-2 text-xs">
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {state.categories.map((c) => {
                const have = c.items.filter((i) => i.image).length;
                return (
                  <div key={c.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate text-white/60">{categoryName(c, lang)}</span>
                    <span className={have > 0 ? "text-lime" : "text-hot"}>
                      {have}/{c.items.length}
                    </span>
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" className={SM} onClick={() => void testImages()}>
              {t("debug.testImages")}
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

        <Collapsible title={t("debug.dangerZone")}>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              className={SM}
              onClick={() => {
                if (window.confirm(t("debug.confirmReset"))) {
                  void send("session:reset", undefined);
                }
              }}
            >
              {t("debug.resetSession")}
            </Button>
            <Button
              variant="ghost"
              className={SM}
              onClick={() => {
                if (window.confirm(t("debug.confirmClearUploads"))) {
                  void fetch("/api/uploads/clear", { method: "POST" });
                }
              }}
            >
              {t("debug.clearUploads")}
            </Button>
            <Button
              variant="ghost"
              className={SM}
              onClick={() => {
                if (window.confirm(t("debug.confirmReseed"))) {
                  void fetch("/api/seed?force=1", { method: "POST" });
                }
              }}
            >
              {t("debug.reseed")}
            </Button>
          </div>
        </Collapsible>
      </div>

      <Collapsible title={t("debug.currentMatch")} defaultOpen>
        {match && category ? (
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="min-w-0 truncate">
                {t("debug.sideA")} {a?.name ?? "—"} · <span className="text-brand">{match.votesA}</span>
              </span>
              <span className="min-w-0 truncate text-end">
                <span className="text-brand-2">{match.votesB}</span> · {b?.name ?? "—"} {t("debug.sideB")}
              </span>
            </div>
            <div className="text-white/50">
              {t("debug.votersA", { names: match.votersA.join(", ") || t("debug.none") })}
              <br />
              {t("debug.votersB", { names: match.votersB.join(", ") || t("debug.none") })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-white/50">{t("debug.noLiveMatch")}</p>
        )}
      </Collapsible>

      <div className="flex min-w-0 flex-col gap-3">
        <Collapsible title={t("debug.eventLog")} defaultOpen>
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

        <Collapsible title={t("debug.rawState")}>
          <pre className="scroll-thin max-h-72 overflow-auto rounded-lg bg-ink-2 p-2 text-[0.7rem] text-white/70">
            {JSON.stringify(state, null, 2)}
          </pre>
        </Collapsible>
      </div>
    </div>
  );
}
