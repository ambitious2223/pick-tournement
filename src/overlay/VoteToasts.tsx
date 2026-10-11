import { useEffect, useRef, useState, type ReactNode } from "react";
import type { VoteToast } from "../../shared/types.ts";
import { Avatar } from "../ui/Avatar.tsx";

const TTL = 2500;
const MAX_PER_SIDE = 4;

export function VoteToasts({ votes }: { votes: VoteToast[] }): ReactNode {
  const [active, setActive] = useState<VoteToast[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const timers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const fresh = votes.filter((v) => !seen.current.has(v.id));
    if (fresh.length === 0) return;
    for (const v of fresh) {
      seen.current.add(v.id);
      const timer = window.setTimeout(() => {
        seen.current.delete(v.id);
        timers.current.delete(v.id);
        setActive((cur) => cur.filter((x) => x.id !== v.id));
      }, TTL);
      timers.current.set(v.id, timer);
    }
    setActive((cur) => [...fresh, ...cur]);
  }, [votes]);

  useEffect(() => () => {
    for (const timer of timers.current.values()) window.clearTimeout(timer);
  }, []);

  if (active.length === 0) return null;

  const sideA = active.filter((v) => v.side === "a").slice(0, MAX_PER_SIDE);
  const sideB = active.filter((v) => v.side === "b").slice(0, MAX_PER_SIDE);

  return (
    <div className="pointer-events-none absolute inset-y-0 w-full">
      <div className="absolute start-2 top-4 flex flex-col gap-2">
        {sideA.map((v) => (
          <Toast key={v.id} toast={v} />
        ))}
      </div>
      <div className="absolute end-2 top-4 flex flex-col gap-2">
        {sideB.map((v) => (
          <Toast key={v.id} toast={v} />
        ))}
      </div>
    </div>
  );
}

function Toast({ toast }: { toast: VoteToast }): ReactNode {
  const tone = toast.side === "a" ? "border-brand text-brand" : "border-brand-2 text-brand-2";
  return (
    <div
      className={`animate-toast flex items-center gap-1.5 rounded-full border bg-ink/80 px-2.5 py-1 text-sm font-bold backdrop-blur-sm ${tone}`}
    >
      <Avatar src={toast.avatar} name={toast.name} size={20} />
      <span className="max-w-[7rem] truncate">{toast.name}</span>
    </div>
  );
}
