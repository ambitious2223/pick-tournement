import type { ReactNode } from "react";
import type { Settings } from "../../shared/types.ts";
import { send } from "../lib/live.ts";
import { useI18n, type TKey } from "../i18n/index.tsx";

const patch = (p: Partial<Settings>): void => void send("settings:update", p);

interface ToggleDef {
  key: keyof Pick<
    Settings,
    "dedupeChat" | "allowVoteChange" | "autoNextMatch" | "autoNextTournament" | "autoStageView" | "showVoteHint"
  >;
  label: TKey;
  desc: TKey;
}

const TOGGLES: ToggleDef[] = [
  { key: "dedupeChat", label: "run.toggle.dedupe", desc: "run.toggle.dedupeDesc" },
  { key: "allowVoteChange", label: "run.toggle.voteChange", desc: "run.toggle.voteChangeDesc" },
  { key: "autoNextMatch", label: "run.toggle.nextMatch", desc: "run.toggle.nextMatchDesc" },
  { key: "autoNextTournament", label: "run.toggle.nextTournament", desc: "run.toggle.nextTournamentDesc" },
  { key: "autoStageView", label: "run.toggle.stageView", desc: "run.toggle.stageViewDesc" },
  { key: "showVoteHint", label: "run.toggle.voteHint", desc: "run.toggle.voteHintDesc" },
];

/** Compact behavior switches for the everyday screen; hover a chip for its description. */
export function RunToggles({ settings }: { settings: Settings }): ReactNode {
  const { t } = useI18n();

  return (
    <div data-tour="run-behavior" className="mt-1 border-t border-line/60 pt-2">
      <div className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("run.behavior")}</div>
      <div data-tour="interactions-actions" className="grid grid-cols-2 gap-1.5">
        {TOGGLES.map(({ key, label, desc }) => {
          const on = settings[key];
          const text = t(label);
          const description = t(desc);
          return (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${text} — ${description}`}
              title={description}
              onClick={() => patch({ [key]: !on } as Partial<Settings>)}
              className={`flex min-w-0 items-center justify-between gap-1.5 rounded-md border px-2 py-1 text-[0.62rem] font-semibold transition ${
                on
                  ? "border-brand/50 bg-brand/10 text-white"
                  : "border-line bg-ink-2/60 text-white/55 hover:border-brand/40 hover:text-white/75"
              }`}
            >
              <span className="min-w-0 truncate text-start">{text}</span>
              <span aria-hidden className={`h-3.5 w-6 shrink-0 rounded-full p-0.5 transition ${on ? "bg-brand" : "bg-line"}`}>
                <span className={`block h-2.5 w-2.5 rounded-full bg-white transition ${on ? "translate-x-2.5" : ""}`} />
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[0.55rem] leading-relaxed text-white/35">{t("run.behaviorHint")}</p>
    </div>
  );
}
