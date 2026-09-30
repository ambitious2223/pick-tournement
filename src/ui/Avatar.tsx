import type { ReactNode } from "react";

/** A local viewer avatar (from /avatars/…), or a colored initials tile. */
export function Avatar({ src, name, size = 28 }: { src: string; name: string; size?: number }): ReactNode {
  const local = src.startsWith("/avatars/") ? src : "";
  const style = { width: size, height: size };
  if (local) {
    return <img src={local} alt="" style={style} className="shrink-0 rounded-full object-cover ring-1 ring-line" />;
  }
  return (
    <span
      style={style}
      className="grid shrink-0 place-items-center rounded-full bg-ink-2 text-[0.6rem] font-bold uppercase text-white/50 ring-1 ring-line"
    >
      {(name || "?").slice(0, 2)}
    </span>
  );
}
