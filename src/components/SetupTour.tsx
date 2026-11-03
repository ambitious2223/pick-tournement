import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "../i18n/index.tsx";
import { TOUR_STEPS, type LocalizedCopy, type TourDemo, type TourStep, type TourTab } from "../onboarding/tourSteps.ts";
import "./setup-tour.css";

function copy(value: LocalizedCopy, lang: "ar" | "en" | "tr"): string {
  return lang === "tr" ? (value.tr ?? value.en) : value[lang];
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** A tiny looping animation inside the card; purely decorative. */
function DemoSample({ demo }: { demo: TourDemo }): ReactNode {
  return (
    <div className={`tour-demo tour-demo-${demo}`} aria-hidden>
      {demo === "tabs" ? (
        <div className="tour-demo-tabs">
          <span className="is-on" />
          <span />
          <span />
          <span />
        </div>
      ) : null}
      {demo === "tap" ? (
        <div className="tour-demo-stage">
          <span className="tour-demo-button" />
          <span className="tour-demo-cursor" />
        </div>
      ) : null}
      {demo === "pick" ? (
        <div className="tour-demo-stage tour-demo-list">
          <span />
          <span className="is-on" />
          <span />
        </div>
      ) : null}
      {demo === "slide" ? (
        <div className="tour-demo-stage">
          <span className="tour-demo-track">
            <span className="tour-demo-knob" />
          </span>
        </div>
      ) : null}
      {demo === "toggle" ? (
        <div className="tour-demo-stage">
          <span className="tour-demo-switch">
            <span />
          </span>
        </div>
      ) : null}
      {demo === "gift" ? (
        <div className="tour-demo-stage">
          <span className="tour-demo-gift">★</span>
        </div>
      ) : null}
    </div>
  );
}

export function SetupTour({
  open,
  onClose,
  onTabChange,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onTabChange: (tab: TourTab) => void;
  onNavigate: (path: string) => void;
}): ReactNode {
  const { t, lang, dir } = useI18n();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);

  // Get started always replays from the first step, even after a full run.
  useEffect(() => {
    if (open && !wasOpen.current) setIndex(0);
    wasOpen.current = open;
  }, [open]);

  const step: TourStep = TOUR_STEPS[index] ?? TOUR_STEPS[0]!;
  const isLast = index === TOUR_STEPS.length - 1;

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(TOUR_STEPS.length - 1, next)));
    },
    [],
  );

  // Switch to the step's tab, scroll its control into view once, then keep the
  // ring glued to that exact element every frame. If the element is hidden (a
  // different tab, or scrolled out of view) the ring disappears instead of
  // floating over unrelated content.
  useEffect(() => {
    if (!open) return;
    if ((step.route ?? "control") === "studio") {
      onNavigate("/studio");
    } else {
      onNavigate("/control");
      onTabChange(step.tab);
    }

    let raf = 0;
    let scrolled = false;
    let lastKey = "";

    const tick = (): void => {
      const ring = ringRef.current;
      if (!ring) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const element = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      if (!element) {
        ring.style.display = "none";
        scrolled = false;
        lastKey = "";
        raf = requestAnimationFrame(tick);
        return;
      }

      if (!scrolled) {
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
        scrolled = true;
      }

      const box = element.getBoundingClientRect();
      const onScreen =
        box.bottom > 1 && box.top < window.innerHeight - 1 && box.right > 1 && box.left < window.innerWidth - 1;
      if (!onScreen) {
        ring.style.display = "none";
        lastKey = "";
        raf = requestAnimationFrame(tick);
        return;
      }

      const width = Math.min(window.innerWidth - 8, Math.max(24, box.width + 12));
      const left = Math.min(Math.max(4, box.left - 6), window.innerWidth - width - 4);
      const top = Math.min(Math.max(4, box.top - 6), window.innerHeight - 32);
      const height = Math.max(24, Math.min(box.height + 12, window.innerHeight - top - 8));
      const key = `${top}:${left}:${width}:${height}`;
      if (key !== lastKey) {
        lastKey = key;
        ring.style.display = "block";
        ring.style.top = `${top}px`;
        ring.style.left = `${left}px`;
        ring.style.width = `${width}px`;
        ring.style.height = `${height}px`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, step.route, step.tab, step.target, onTabChange, onNavigate]);

  useEffect(() => {
    if (!open) return;
    cardRef.current?.focus();
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (isTyping(event.target)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isLast) onClose();
        else go(index + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, isLast, go, onClose]);

  if (!open) return null;

  const title = copy(step.title, lang);
  const body = copy(step.body, lang);
  const example = copy(step.example, lang);

  return (
    <div className="setup-tour-root" dir={dir}>
      {step.target ? (
        <div ref={ringRef} className="setup-tour-ring" style={{ display: "none" }} aria-hidden>
          <span className={`setup-tour-ghost ${reduced ? "is-still" : ""}`} />
        </div>
      ) : null}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="setup-tour-title"
        aria-describedby="setup-tour-body"
        tabIndex={-1}
        className="setup-tour-card"
      >
        <div className="setup-tour-head">
          <div className="setup-tour-heading">
            <span className="setup-tour-kicker">{t("setupTour.kicker")}</span>
            <h2 id="setup-tour-title" className="setup-tour-title">
              {title}
            </h2>
          </div>
          <div className="setup-tour-head-actions">
            <span className="setup-tour-progress" aria-live="polite">
              {index + 1} / {TOUR_STEPS.length}
            </span>
            <button type="button" className="setup-tour-close" onClick={onClose} aria-label={t("common.close")}>
              ×
            </button>
          </div>
        </div>

        <div className="setup-tour-main">
          <div className="setup-tour-copy">
            <p id="setup-tour-body" className="setup-tour-body">
              {body}
            </p>
            <p className="setup-tour-example">{example}</p>
          </div>
          <DemoSample demo={step.demo} />
        </div>

        <div className="setup-tour-foot">
          <button type="button" className="setup-tour-btn" disabled={index === 0} onClick={() => go(index - 1)}>
            {t("setupTour.back")}
          </button>
          <div className="setup-tour-foot-end">
            <button type="button" className="setup-tour-btn is-quiet" onClick={onClose}>
              {isLast ? t("setupTour.done") : t("setupTour.skip")}
            </button>
            {!isLast ? (
              <button type="button" className="setup-tour-btn is-primary" onClick={() => go(index + 1)}>
                {t("setupTour.next")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
