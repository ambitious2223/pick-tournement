import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { Button, Select } from "../ui/primitives.tsx";
import { ThumbMosaic } from "../ui/ThumbMosaic.tsx";
import { send } from "../lib/live.ts";
import { categoryName } from "../lib/selectors.ts";
import { useI18n } from "../i18n/index.tsx";

export function QueueEditor({ state }: { state: SessionState }): ReactNode {
  const { t, lang } = useI18n();
  const queue = state.queue;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= queue.length) return;
    const next = [...queue];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    void send("queue:set", next);
  };

  return (
    <div data-tour="queue-panel" className="flex flex-col gap-2">
      <Select
        defaultValue=""
        className="px-2 py-1 text-xs"
        onChange={(e) => {
          if (e.target.value) {
            void send("queue:add", e.target.value);
            e.target.value = "";
          }
        }}
      >
        <option value="">{t("queue.add")}</option>
        {state.categories.map((c) => (
          <option key={c.id} value={c.id}>
            {categoryName(c, lang)}
          </option>
        ))}
      </Select>

      {queue.length === 0 ? (
        <p className="text-xs text-white/50">{t("queue.empty")}</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {queue.map((entry, i) => {
            const category = state.categories.find((c) => c.id === entry.categoryId);
            const current = i === state.queueIndex;
            return (
              <li
                key={`${entry.categoryId}-${i}`}
                className={`card flex items-center gap-2 px-1.5 py-1.5 text-xs ${
                  current ? "card-active" : "card-hover"
                }`}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink/70 text-[0.6rem] font-bold text-white/60">
                  {i + 1}
                </span>
                {category ? <ThumbMosaic items={category.items} tileClass="h-5 w-5" /> : null}
                <span className="min-w-0 flex-1 truncate">{category ? categoryName(category, lang) : entry.categoryId}</span>
                <button onClick={() => move(i, i - 1)} className="px-1 text-white/50 hover:text-white">
                  ↑
                </button>
                <button onClick={() => move(i, i + 1)} className="px-1 text-white/50 hover:text-white">
                  ↓
                </button>
                <button onClick={() => void send("queue:remove", i)} className="px-1 text-hot">
                  ✕
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => void send("queue:set", [])}>
        {t("queue.clear")}
      </Button>
    </div>
  );
}
