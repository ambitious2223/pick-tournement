import type { ReactNode } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  hint?: string;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}): ReactNode {
  return (
    <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-ink-2/70 p-1">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[0.7rem] font-bold transition ${
              active ? "bg-brand text-ink" : "text-white/60 hover:bg-surface"
            }`}
          >
            <span className="truncate">{tab.label}</span>
            {tab.hint ? <span className="shrink-0 text-[0.6rem] opacity-70">{tab.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
