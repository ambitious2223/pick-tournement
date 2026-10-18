import { useEffect, useState, type ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { useI18n, type TKey } from "../i18n/index.tsx";
import { CUE_IDS } from "../sound/catalog.ts";
import { Dialog } from "../ui/Dialog.tsx";

const OVERLAY_URL = "http://127.0.0.1:8787/overlay";

type StepId = "start" | "library" | "content" | "tikora" | "sound" | "obs" | "run";

interface StepDef {
  id: StepId;
  title: TKey;
  summary: TKey;
  bullets: TKey[];
  href: string;
  external?: boolean;
  action: TKey;
  secondaryHref?: string;
  secondaryAction?: TKey;
  secondaryCopy?: boolean;
}

const STEPS: StepDef[] = [
  {
    id: "start",
    title: "setup.step.start.title",
    summary: "setup.step.start.summary",
    bullets: ["setup.step.start.b1", "setup.step.start.b2", "setup.step.start.b3"],
    href: "/control?tab=run",
    action: "setup.action.openControl",
  },
  {
    id: "library",
    title: "setup.step.library.title",
    summary: "setup.step.library.summary",
    bullets: ["setup.step.library.b1", "setup.step.library.b2", "setup.step.library.b3"],
    href: "/control?tab=run",
    action: "setup.action.openControl",
  },
  {
    id: "content",
    title: "setup.step.content.title",
    summary: "setup.step.content.summary",
    bullets: ["setup.step.content.b1", "setup.step.content.b2", "setup.step.content.b3"],
    href: "/studio",
    action: "setup.action.openStudio",
    secondaryHref: "/control?tab=queue",
    secondaryAction: "setup.action.openQueue",
  },
  {
    id: "tikora",
    title: "setup.step.tikora.title",
    summary: "setup.step.tikora.summary",
    bullets: ["setup.step.tikora.b1", "setup.step.tikora.b2", "setup.step.tikora.b3"],
    href: "/debug",
    action: "setup.action.openDebug",
  },
  {
    id: "sound",
    title: "setup.step.sound.title",
    summary: "setup.step.sound.summary",
    bullets: ["setup.step.sound.b1", "setup.step.sound.b2", "setup.step.sound.b3"],
    href: "/control?tab=settings&open=advanced",
    action: "setup.action.openSound",
    secondaryHref: "/control?tab=run",
    secondaryAction: "setup.action.openRun",
  },
  {
    id: "obs",
    title: "setup.step.obs.title",
    summary: "setup.step.obs.summary",
    bullets: ["setup.step.obs.b1", "setup.step.obs.b2", "setup.step.obs.b3"],
    href: OVERLAY_URL,
    external: true,
    action: "setup.action.openShow",
    secondaryCopy: true,
    secondaryAction: "setup.copyOverlay",
  },
  {
    id: "run",
    title: "setup.step.run.title",
    summary: "setup.step.run.summary",
    bullets: ["setup.step.run.b1", "setup.step.run.b2", "setup.step.run.b3", "setup.step.run.b4"],
    href: "/control?tab=run",
    action: "setup.action.openRun",
    secondaryHref: "/control?tab=sim",
    secondaryAction: "setup.action.openSim",
  },
];

const LINK_PRIMARY =
  "rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-ink transition hover:brightness-110";
const LINK_SECONDARY = "rounded-lg border border-line px-3 py-1.5 text-xs text-white/70 transition hover:border-brand hover:text-brand";

function StatusChip({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "idle";
  href?: string;
}): ReactNode {
  const dot = tone === "ok" ? "bg-lime" : tone === "warn" ? "bg-hot" : "bg-white/30";
  const body = (
    <>
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0 flex-1 truncate text-white/50">{label}</span>
      <span className="shrink-0 font-bold text-white/85">{value}</span>
    </>
  );
  const className =
    "flex items-center gap-2 rounded-lg border border-line bg-ink-2/60 px-2.5 py-1.5 text-[0.68rem] transition";
  return href ? (
    <a href={href} className={`${className} hover:border-brand/50`}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

function StepVisual({ id }: { id: StepId }): ReactNode {
  const shell = "relative flex h-32 items-center justify-center overflow-hidden rounded-xl border border-line bg-ink-2/70 p-3";

  if (id === "start") {
    return (
      <div aria-hidden className={shell}>
        <div className="flex flex-col items-center gap-3">
          <div className="text-lg font-black tracking-tight">
            <span className="text-brand">PICK</span> LEAGUE
          </div>
          <div className="flex gap-1 text-[0.55rem] font-bold">
            <span className="rounded bg-brand px-3 py-1 text-ink">Control</span>
            <span className="rounded border border-line px-3 py-1 text-white/35">Studio</span>
            <span className="rounded border border-line px-3 py-1 text-white/35">Guide</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === "library") {
    return (
      <div aria-hidden className={`${shell} gap-2`}>
        <span className="rounded-lg border border-brand bg-brand/10 px-4 py-2 text-sm font-black text-brand">AR</span>
        <span className="rounded-lg border border-line px-4 py-2 text-sm font-black text-white/30">EN</span>
        <span className="ms-2 h-14 w-20 rounded-lg border border-line bg-gradient-to-br from-brand/35 to-brand-2/35" />
      </div>
    );
  }

  if (id === "content") {
    const tones = ["from-brand/40 to-brand-2/20", "from-brand-2/40 to-hot/20", "from-lime/40 to-brand/20"];
    return (
      <div aria-hidden className={`${shell} grid grid-cols-3 gap-2`}>
        {tones.map((tone) => (
          <div key={tone} className="flex min-w-0 flex-col gap-1.5">
            <div className={`h-14 rounded-lg bg-gradient-to-br ${tone}`} />
            <div className="h-1 rounded bg-line" />
            <div className="h-1 w-2/3 rounded bg-line" />
          </div>
        ))}
      </div>
    );
  }

  if (id === "tikora") {
    return (
      <div aria-hidden className={`${shell} flex-col items-stretch justify-center gap-3`}>
        <div className="flex items-center gap-2 text-xs font-bold text-white/70">
          <span className="h-2 w-2 rounded-full bg-lime" />
          Tikora
        </div>
        <div className="h-1 rounded bg-line">
          <div className="h-1 w-2/3 rounded bg-lime" />
        </div>
        <div className="text-[0.6rem] text-white/35">Live connection</div>
      </div>
    );
  }

  if (id === "sound") {
    return (
      <div aria-hidden className={`${shell} flex-col items-stretch justify-center gap-3`}>
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 rounded bg-line">
            <div className="h-1 w-2/3 rounded bg-brand" />
          </div>
          <span className="text-[0.55rem] text-white/40">Master</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line px-2 py-1 text-[0.55rem] text-white/45">
          <span>champion.win</span>
          <span className="font-bold text-lime">Uploaded</span>
        </div>
      </div>
    );
  }

  if (id === "obs") {
    return (
      <div aria-hidden className={`${shell} flex-col items-stretch justify-center gap-2`}>
        <div className="text-[0.55rem] font-bold uppercase tracking-widest text-white/35">OBS Browser Source</div>
        <div className="rounded-lg border border-line bg-ink px-2 py-1 font-mono text-[0.55rem] text-brand">127.0.0.1:8787/overlay</div>
        <div className="flex justify-end">
          <span className="rounded bg-brand px-2 py-1 text-[0.55rem] font-bold text-ink">Copy</span>
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden className={`${shell} flex-col gap-3`}>
      <span className="rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-ink">Start show</span>
      <div className="flex gap-1 text-[0.55rem] text-white/40">
        <span className="rounded border border-line px-2 py-0.5">Vote</span>
        <span className="rounded border border-line px-2 py-0.5">Bracket</span>
        <span className="rounded border border-line px-2 py-0.5">Champion</span>
      </div>
    </div>
  );
}

export function Setup({ state, connected }: { state: SessionState | null; connected: boolean }): ReactNode {
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const [soundFiles, setSoundFiles] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/sounds", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<string[]>) : []))
      .then((list) => {
        if (!live) return;
        const uploaded = new Set(
          list.map((name) => name.replace(/\.[a-z0-9]+$/i, "")).filter((id) => (CUE_IDS as readonly string[]).includes(id)),
        );
        setSoundFiles(uploaded.size);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const copyOverlay = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(OVERLAY_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be unavailable; the URL is still visible in the step */
    }
  };

  const categories = state?.categories.length ?? 0;
  const queue = state?.queue.length ?? 0;
  const tikora = state?.live.connected ?? false;
  const showRunning = state?.show.active ?? false;
  const showValue = !showRunning ? t("status.idle") : state?.show.paused ? t("show.paused") : t("status.running");
  const ready: Record<StepId, boolean | undefined> = {
    start: connected,
    library: categories > 0,
    content: categories > 0 && queue > 0,
    tikora,
    sound: soundFiles > 0,
    obs: undefined,
    run: showRunning,
  };

  const step = active === null ? null : STEPS[active] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <section className="panel animate-rise overflow-hidden p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="chip inline-block text-brand">{t("setup.badge")}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{t("setup.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{t("setup.intro")}</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <a href="/control?tab=run" className={LINK_PRIMARY}>
              {t("setup.quick.openRun")}
            </a>
            <a href={OVERLAY_URL} target="_blank" rel="noreferrer" className={LINK_SECONDARY}>
              {t("setup.quick.openShow")}
            </a>
            <a href="/studio" className={LINK_SECONDARY}>
              {t("setup.quick.openStudio")}
            </a>
            <button type="button" onClick={() => void copyOverlay()} className={LINK_SECONDARY}>
              {copied ? t("setup.copied") : t("setup.copyOverlay")}
            </button>
          </div>
        </div>

        <div className="mt-6 border-t border-line/60 pt-4">
          <div className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("setup.readiness")}</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <StatusChip
              label={t("setup.status.server")}
              value={connected ? t("live.connected") : t("live.disconnected")}
              tone={connected ? "ok" : "warn"}
            />
            <StatusChip
              label={t("setup.status.tikora")}
              value={tikora ? t("live.connected") : t("live.disconnected")}
              tone={tikora ? "ok" : "warn"}
              href="/debug"
            />
            <StatusChip
              label={t("setup.status.categories")}
              value={String(categories)}
              tone={categories > 0 ? "ok" : "warn"}
              href="/studio"
            />
            <StatusChip
              label={t("setup.status.queue")}
              value={String(queue)}
              tone={queue > 0 ? "ok" : "idle"}
              href="/control?tab=queue"
            />
            <StatusChip
              label={t("setup.status.sound")}
              value={t("setup.status.soundValue", { have: soundFiles, total: CUE_IDS.length })}
              tone={soundFiles > 0 ? "ok" : "idle"}
              href="/control?tab=settings&open=advanced"
            />
            <StatusChip
              label={t("setup.status.show")}
              value={showValue}
              tone={showRunning ? "ok" : "idle"}
              href="/control?tab=run"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-black tracking-tight">{t("setup.stepsTitle")}</h2>
          <p className="text-xs text-white/40">{t("setup.stepsHint")}</p>
        </div>
        <div className="relative flex flex-col gap-2.5">
          <div aria-hidden className="absolute bottom-6 start-[1.125rem] top-6 w-px bg-line" />
          {STEPS.map((item, index) => {
            const done = ready[item.id] === true;
            return (
              <div key={item.id} className="relative flex items-stretch gap-3">
                <div
                  className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center self-start rounded-full border text-xs font-black ${
                    done ? "border-lime/60 bg-lime/15 text-lime" : "border-brand/50 bg-ink-2 text-brand"
                  }`}
                >
                  {done ? "✓" : index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-haspopup="dialog"
                  className="panel group flex min-w-0 flex-1 flex-col gap-1 p-3 text-start transition hover:border-brand/50 hover:bg-surface/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold">{t(item.title)}</h3>
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[0.55rem] text-white/35 transition group-hover:text-brand">
                      {t("setup.details")}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-white/50">{t(item.summary)}</p>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <Dialog
        open={active !== null}
        onClose={() => setActive(null)}
        eyebrow={active === null ? undefined : t("setup.stepOf", { n: active + 1, total: STEPS.length })}
        title={step ? t(step.title) : ""}
        footer={
          step && active !== null ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={active === 0}
                  onClick={() => setActive(Math.max(0, active - 1))}
                  className={`${LINK_SECONDARY} disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  {t("setup.back")}
                </button>
                <button
                  type="button"
                  disabled={active === STEPS.length - 1}
                  onClick={() => setActive(Math.min(STEPS.length - 1, active + 1))}
                  className={`${LINK_SECONDARY} disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  {t("setup.next")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {step.secondaryCopy ? (
                  <button type="button" onClick={() => void copyOverlay()} className={LINK_SECONDARY}>
                    {copied ? t("setup.copied") : t("setup.copyOverlay")}
                  </button>
                ) : step.secondaryHref && step.secondaryAction ? (
                  <a href={step.secondaryHref} className={LINK_SECONDARY}>
                    {t(step.secondaryAction)}
                  </a>
                ) : null}
                <a
                  href={step.href}
                  target={step.external ? "_blank" : undefined}
                  rel={step.external ? "noreferrer" : undefined}
                  className={LINK_PRIMARY}
                >
                  {t(step.action)}
                </a>
              </div>
            </div>
          ) : null
        }
      >
        {step ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-white/60">{t(step.summary)}</p>
            <StepVisual id={step.id} />
            <ul className="flex flex-col gap-2">
              {step.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-white/75">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{t(bullet)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
