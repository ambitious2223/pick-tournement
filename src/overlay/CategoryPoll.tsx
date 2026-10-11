import type { ReactNode } from "react";
import type { Category, SessionState } from "../../shared/types.ts";
import { useI18n } from "../i18n/index.tsx";
import { useNow } from "../lib/live.ts";
import { categoryName } from "../lib/selectors.ts";
import { Avatar } from "../ui/Avatar.tsx";
import { ItemVisual } from "./ItemVisual.tsx";

function resolveCandidates(state: SessionState): Category[] {
  const ids = state.show.categoryCandidates.length
    ? state.show.categoryCandidates
    : state.categories.map((c) => c.id);
  const resolved: Category[] = [];
  for (const id of ids) {
    const cat = state.categories.find((c) => c.id === id);
    if (cat) resolved.push(cat);
  }
  return resolved;
}

export function CategoryPoll({ state }: { state: SessionState }): ReactNode {
  const { t, lang } = useI18n();
  const now = useNow(true);
  const candidates = resolveCandidates(state);
  const votesOf = (id: string) => state.show.categoryVotes[id] ?? 0;
  const totalVotes = candidates.reduce((sum, c) => sum + votesOf(c.id), 0);
  const remaining = state.show.phaseEndsAt ? Math.max(0, Math.ceil((state.show.phaseEndsAt - now) / 1000)) : 0;

  let leaderId = "";
  let leaderVotes = 0;
  for (const c of candidates) {
    const v = votesOf(c.id);
    if (v > leaderVotes) {
      leaderVotes = v;
      leaderId = c.id;
    }
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand">{t("poll.title")}</h1>
          <p className="text-sm font-bold text-white/75">{t("poll.hint")}</p>
        </div>
        {state.show.phaseEndsAt ? (
          <div className="text-3xl font-black text-[color:var(--round)]">
            {remaining}
            <span className="ms-1 text-sm font-bold text-white/60">{t("show.seconds")}</span>
          </div>
        ) : null}
      </div>

      {totalVotes === 0 ? <div className="text-lg font-bold text-white/50">{t("poll.noVotes")}</div> : null}

      <div className="flex w-full items-end justify-center gap-3">
        {candidates.map((cat) => {
          const votes = votesOf(cat.id);
          const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
          const isLeader = cat.id === leaderId && votes > 0;
          const dim = votes === 0;
          const voters = state.show.categoryVoterList[cat.id] ?? [];
          const shown = voters.slice(0, 6);
          const extra = voters.length - shown.length;
          const thumb = cat.items.find((i) => i.image) ?? cat.items[0] ?? null;
          return (
            <div
              key={cat.id}
              className={`animate-rise flex w-[clamp(5rem,13vw,9rem)] flex-col items-center gap-1.5 rounded-2xl p-2 ${
                dim ? "opacity-40" : ""
              } ${isLeader ? "ring-2 ring-[color:var(--round)] shadow-[0_0_40px_-8px_var(--round)]" : ""}`}
            >
              <div className={`text-xs font-black uppercase tracking-widest ${isLeader ? "text-[color:var(--round)]" : "opacity-0"}`}>
                {t("poll.leading")}
              </div>
              <div className="text-2xl font-black text-white">{pct}%</div>
              <div className="text-xs text-white/60">{t("poll.votes", { n: votes })}</div>
              <div className="max-w-full truncate text-sm font-bold text-white/90">{categoryName(cat, lang)}</div>
              <ItemVisual item={thumb} className="h-12 w-12" emojiClassName="text-2xl" />
              <div className="flex h-7 items-center justify-center gap-1">
                {shown.map((v) => (
                  <Avatar key={v.id} src={v.avatar} name={v.name} size={22} />
                ))}
                {extra > 0 ? (
                  <span className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-ink-2 px-1 text-[0.6rem] font-bold text-white/60 ring-1 ring-line">
                    +{extra}
                  </span>
                ) : null}
              </div>
              <div
                className="relative w-full overflow-hidden rounded-t-xl border border-line bg-ink/70"
                style={{ height: "clamp(5rem,26vh,14rem)" }}
              >
                <div
                  className={`absolute inset-x-0 bottom-0 ${isLeader ? "bg-brand" : "bg-brand/60"}`}
                  style={{ height: `${pct}%`, transition: "height 0.6s ease" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
