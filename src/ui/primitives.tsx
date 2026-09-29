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
    <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-white/60">
      {label}
      {children}
    </label>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return (
    <input
      {...props}
      className={`rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-white outline-none focus:border-brand ${className}`}
    />
  );
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>): ReactNode {
  return (
    <select
      {...props}
      className={`rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-white outline-none focus:border-brand ${className}`}
    >
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }): ReactNode {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm"
    >
      <span className="text-white/70">{label}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? "bg-brand" : "bg-line"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}
