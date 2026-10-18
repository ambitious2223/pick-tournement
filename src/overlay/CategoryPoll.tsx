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
    <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,2rem)] p-[clamp(0.5rem,2vh,1.5rem)]">
      <div className="flex w-full items-center justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.75rem,5vh,3.5rem)] font-black text-brand">{t("poll.title")}</h1>
          <p className="text-[clamp(1rem,2.6vh,1.75rem)] font-bold text-white/85">{t("poll.hint", { max: candidates.length })}</p>
        </div>
        {state.show.phaseEndsAt ? (
          <div className="text-[clamp(2rem,5.5vh,4rem)] font-black text-[color:var(--round)]">
            {remaining}
            <span className="ms-1 text-[clamp(0.9rem,2.2vh,1.4rem)] font-bold text-white/85">{t("show.seconds")}</span>
          </div>
        ) : null}
      </div>

      {totalVotes === 0 ? (
        <div className="text-[clamp(1rem,2.6vh,1.75rem)] font-bold text-white/70">{t("poll.noVotes")}</div>
      ) : null}

      <div className="flex w-full items-end justify-center gap-[clamp(0.5rem,1.5vw,1.5rem)]">
        {candidates.map((cat, idx) => {
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
              className={`animate-rise flex w-[clamp(7rem,18vw,16rem)] flex-col items-center gap-[clamp(0.25rem,1vh,0.75rem)] rounded-2xl p-[clamp(0.4rem,1.5vh,1rem)] ${
                dim ? "opacity-70" : ""
              } ${isLeader ? "ring-2 ring-[color:var(--round)] shadow-[0_0_40px_-8px_var(--round)]" : ""}`}
            >
              <div className="flex items-center justify-center gap-[clamp(0.4rem,1vw,0.9rem)]">
                <div
                  className={`grid h-[clamp(2.25rem,6.5vh,4rem)] w-[clamp(2.25rem,6.5vh,4rem)] place-items-center rounded-full text-[clamp(1.15rem,3.8vh,2.25rem)] font-black shadow-lg ${
                    isLeader ? "bg-[color:var(--round)] text-ink" : "bg-brand text-ink"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="text-[clamp(1.5rem,5vh,3.5rem)] font-black text-white">{pct}%</div>
              </div>
              <div
                className={`text-[clamp(0.7rem,1.8vh,1.1rem)] font-black uppercase tracking-widest ${
                  isLeader ? "text-[color:var(--round)]" : "opacity-0"
                }`}
              >
                {t("poll.leading")}
              </div>
              <div className="text-[clamp(0.8rem,2.2vh,1.4rem)] text-white/80">{t("poll.votes", { n: votes })}</div>
              <div className="min-h-[2.4em] max-w-full text-center text-[clamp(1rem,3vh,2rem)] font-bold text-white/95">
                {categoryName(cat, lang)}
              </div>
              <ItemVisual
                item={thumb}
                className="h-[clamp(3rem,9vh,6rem)] w-[clamp(3rem,9vh,6rem)]"
                emojiClassName="text-[clamp(1.25rem,3.5vh,2.5rem)]"
              />
              <div className="flex h-[clamp(1.5rem,4vh,2.5rem)] items-center justify-center gap-1">
                {shown.map((v) => (
                  <Avatar key={v.id} src={v.avatar} name={v.name} size={26} />
                ))}
                {extra > 0 ? (
                  <span className="grid h-[26px] min-w-[26px] place-items-center rounded-full bg-ink-2 px-1 text-[clamp(0.6rem,1.6vh,0.9rem)] font-bold text-white/70 ring-1 ring-line">
                    +{extra}
                  </span>
                ) : null}
              </div>
              <div
                className="relative w-full overflow-hidden rounded-t-xl border border-line bg-ink/70"
                style={{ height: "clamp(4rem,26vh,14rem)" }}
              >
                <div
                  className={`absolute inset-x-0 bottom-0 ${isLeader ? "bg-brand" : "bg-brand/75"}`}
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
