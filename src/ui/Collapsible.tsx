import { useState, type ReactNode } from "react";

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  hint,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  hint?: string;
}): ReactNode {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-surface/60"
      >
        <span className="text-[0.7rem] font-bold uppercase tracking-widest text-brand">{title}</span>
        <span className="flex items-center gap-2">
          {hint ? <span className="text-[0.65rem] text-white/40">{hint}</span> : null}
          <span className="text-white/40">{open ? "−" : "+"}</span>
        </span>
      </button>
      {open ? <div className="border-t border-line/60 px-3 py-3">{children}</div> : null}
    </section>
  );
}
