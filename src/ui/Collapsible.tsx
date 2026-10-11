import { useState, type ReactNode } from "react";

const STORAGE_PREFIX = "pl.collapse.";

function readOpen(key: string | undefined, fallback: boolean): boolean {
  if (!key) return fallback;
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    return stored === null ? fallback : stored === "1";
  } catch {
    return fallback;
  }
}

function writeOpen(key: string | undefined, open: boolean): void {
  if (!key) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, open ? "1" : "0");
  } catch {
    /* ignore storage errors */
  }
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  hint,
  persistKey,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  hint?: string;
  /** When set, the open/closed state is remembered across sessions. */
  persistKey?: string;
}): ReactNode {
  const [open, setOpen] = useState(() => readOpen(persistKey, defaultOpen));
  const toggle = (): void => {
    setOpen((current) => {
      const next = !current;
      writeOpen(persistKey, next);
      return next;
    });
  };
  return (
    <section className="panel min-w-0 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start transition hover:bg-surface/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="min-w-0 break-words text-start text-[0.7rem] font-bold uppercase tracking-widest text-brand">{title}</span>
        <span className="flex shrink-0 items-center gap-2">
          {hint ? <span className="text-[0.65rem] text-white/40">{hint}</span> : null}
          <span className="text-white/40">{open ? "−" : "+"}</span>
        </span>
      </button>
      {open ? <div className="border-t border-line/60 px-3 py-3">{children}</div> : null}
    </section>
  );
}
