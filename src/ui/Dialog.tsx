import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/index.tsx";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A centered pop-out panel. Closes on Escape or a backdrop click, keeps focus
 * inside while open, and returns focus to whatever opened it.
 */
export function Dialog({
  open,
  title,
  eyebrow,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}): ReactNode {
  const { t } = useI18n();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (item) => item.offsetParent !== null,
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-rise panel flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-b-none sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {eyebrow ? <div className="text-[0.6rem] font-bold uppercase tracking-widest text-brand">{eyebrow}</div> : null}
            <h2 id={titleId} className="mt-0.5 break-words text-lg font-black">
              {title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="shrink-0 rounded-md border border-line px-2 py-1 text-sm text-white/60 transition hover:border-brand hover:text-brand"
          >
            ✕
          </button>
        </header>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? <footer className="border-t border-line px-4 py-3">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
