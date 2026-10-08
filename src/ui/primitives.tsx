import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "hot" | "lime";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-ink hover:brightness-110",
  ghost: "bg-surface/70 text-white border border-line hover:border-brand",
  danger: "bg-hot text-ink hover:brightness-110",
  hot: "bg-brand-2 text-white hover:brightness-110",
  lime: "bg-lime text-ink hover:brightness-110",
};

export function Button({
  variant = "ghost",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }): ReactNode {
  return (
    <button
      {...props}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }): ReactNode {
  return (
    <section className={`panel p-4 ${className}`}>
      {title ? <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <label className="flex min-w-0 flex-col gap-1 break-words text-xs uppercase tracking-wide text-white/60">
      {label}
      {children}
    </label>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return (
    <input
      {...props}
      className={`w-full min-w-0 rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-white outline-none focus:border-brand ${className}`}
    />
  );
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>): ReactNode {
  return (
    <select
      {...props}
      className={`w-full min-w-0 rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-white outline-none focus:border-brand ${className}`}
    >
      {children}
    </select>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  display,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  display?: (v: number) => string;
}): ReactNode {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 text-white/50">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer accent-brand"
      />
      {display ? <span className="w-10 shrink-0 text-end text-white/60">{display(value)}</span> : null}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
    >
      <span className="text-white/70">{label}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? "bg-brand" : "bg-line"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}
