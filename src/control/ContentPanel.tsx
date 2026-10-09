import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Category, SessionState } from "../../shared/types.ts";
import { send } from "../lib/live.ts";
import { categoryName, itemName } from "../lib/selectors.ts";
import { Button } from "../ui/primitives.tsx";
import { CategoryEditor } from "./CategoryEditor.tsx";
import { useI18n } from "../i18n/index.tsx";

type Coverage = { id: string; name: string; have: number; total: number };

const can = "shrink-0 rounded border border-line px-1.5 py-0.5 text-[0.6rem] transition";

export function ContentPanel({ state }: { state: SessionState }): ReactNode {
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<Coverage[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);

  const flash = (text: string): void => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 4000);
  };

  const loadCoverage = useCallback(() => {
    fetch("/api/photos/coverage")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setCoverage(Array.isArray(rows) ? (rows as Coverage[]) : []))
      .catch(() => setCoverage([]));
  }, []);

  useEffect(() => {
    loadCoverage();
  }, [loadCoverage]);

  const fetchPhotosFor = async (categoryId: string): Promise<void> => {
    setBusyId(categoryId);
    try {
      const res = await fetch(`/api/photos/fetch?category=${encodeURIComponent(categoryId)}`, { method: "POST" });
      const data = (await res.json()) as { changed?: number; skipped?: number; error?: string };
      if (!res.ok) flash(t("studio.failed", { error: data.error ?? String(res.status) }));
      else flash(t("studio.fetchSummary", { changed: data.changed ?? 0, skipped: data.skipped ?? 0 }));
    } catch {
      flash(t("studio.serverUnreachable"));
    } finally {
      setBusyId(null);
      loadCoverage();
    }
  };

  const removeCategory = async (id: string): Promise<void> => {
    await send("category:delete", id);
    setConfirmId(null);
    if (selected === id) setSelected(null);
    flash(t("content.deleted"));
    loadCoverage();
  };

  const removeItem = async (category: Category, itemId: string): Promise<void> => {
    await send("category:save", { ...category, items: category.items.filter((i) => i.id !== itemId) });
    flash(t("content.deleted"));
    loadCoverage();
  };

  const newCategory = (): void => {
    setEditing({
      id: `new-${Date.now().toString(36)}`,
      name: t("content.defaultCategoryName"),
      nameAr: t("content.defaultCategoryNameAr"),
      items: [{ id: `new-${Date.now().toString(36)}`, name: "", aliases: [] }],
      giftPair: [
        { id: "rose", name: "Rose", icon: "🌹" },
        { id: "tiktok", name: "TikTok", icon: "🎵" },
      ],
    });
  };

  const move = (index: number, dir: -1 | 1): void => {
    const next = [...state.categories];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    const a = next[index];
    const b = next[to];
    if (!a || !b) return;
    next[index] = b;
    next[to] = a;
    void send("category:reorder", next.map((c) => c.id));
  };

  const current: Category | undefined = state.categories.find((c) => c.id === selected);
  const lastCategory = state.categories.length <= 1;

  return (
    <div className="flex flex-col gap-2">
      {message ? <p className="text-[0.65rem] leading-snug text-lime">{message}</p> : null}

      {current ? (
        <div className="rounded-lg border border-brand/60 bg-ink-2 p-2">
          <div className="mb-2 flex items-center justify-between px-0.5">
            <span className="min-w-0 truncate text-[0.65rem] font-bold uppercase tracking-widest text-brand">
              {categoryName(current, lang)}
            </span>
            <span className="shrink-0 text-[0.6rem] text-white/35">
              {current.items.length}/16 · {t("content.competitors")}
            </span>
          </div>
          <ul className="scroll-thin flex max-h-64 flex-col gap-1 overflow-y-auto pe-1">
            {current.items.map((item, index) => {
              const shown = itemName(item, lang);
              const alias = item.aliases[0] ?? "";
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded border border-line/60 bg-ink px-1.5 py-1"
                >
                  <span className="w-4 shrink-0 text-end text-[0.6rem] text-white/35">{index + 1}</span>
                  <span className={`shrink-0 text-xs ${item.image ? "" : "text-hot"}`} title={item.image ? "" : t("content.noPhoto")}>
                    {item.image ? "🖼" : item.emoji || "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs">{shown}</span>
                  {alias && alias !== shown ? (
                    <span className="min-w-0 max-w-[5rem] truncate text-[0.55rem] text-white/40">{alias}</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      current.items.length <= 1
                        ? flash(t("content.lastItem"))
                        : void removeItem(current, item.id)
                    }
                    className={`${can} text-white/45 hover:border-hot hover:text-hot ${
                      current.items.length <= 1 ? "opacity-40" : ""
                    }`}
                    title={t("content.remove")}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="rounded-lg border border-line bg-ink-2 px-2 py-2 text-[0.65rem] text-white/40">
          {t("content.pick")}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{t("studio.categories")}</span>
        <span className="flex items-center gap-2">
          <span className="text-[0.6rem] text-white/35">{state.categories.length}</span>
          <Button variant="primary" className="px-2 py-0.5 text-[0.65rem]" onClick={newCategory}>
            {t("content.newCategory")}
          </Button>
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {state.categories.length === 0 ? (
          <li className="text-[0.65rem] text-white/40">{t("content.noCategories")}</li>
        ) : null}
        {state.categories.map((c, index) => {
          const cov = coverage.find((v) => v.id === c.id);
          const queued = state.queue.some((entry) => entry.categoryId === c.id);
          const active = selected === c.id;
          const missing = cov ? cov.have < cov.total : false;
          return (
            <li
              key={c.id}
              className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-1 ${
                active ? "border-brand bg-brand/10" : "border-line bg-ink-2"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelected(active ? null : c.id)}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-start"
              >
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">{categoryName(c, lang)}</span>
                {queued ? (
                  <span className="shrink-0 rounded bg-surface px-1 py-0.5 text-[0.55rem] text-white/55">
                    {t("content.queued")}
                  </span>
                ) : null}
                <span className={`shrink-0 text-[0.6rem] ${missing ? "font-bold text-hot" : "text-white/40"}`}>
                  {cov ? t("content.coverage", { have: cov.have, total: cov.total }) : ""}
                </span>
              </button>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className={`${can} text-white/45 hover:border-brand hover:text-brand disabled:opacity-25`}
                title={t("content.moveUp")}
              >
                ⇧
              </button>
              <button
                type="button"
                disabled={index === state.categories.length - 1}
                onClick={() => move(index, 1)}
                className={`${can} text-white/45 hover:border-brand hover:text-brand disabled:opacity-25`}
                title={t("content.moveDown")}
              >
                ⇩
              </button>
              <button
                type="button"
                onClick={() => setEditing(structuredClone(c))}
                className={`${can} text-white/60 hover:border-brand hover:text-brand`}
                title={t("content.edit")}
              >
                ✎
              </button>
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => void fetchPhotosFor(c.id)}
                className={`${can} text-white/60 hover:border-brand hover:text-brand disabled:opacity-40`}
                title={t("studio.fetchPhotos")}
              >
                {busyId === c.id ? "…" : "🖼"}
              </button>
              {confirmId === c.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => void removeCategory(c.id)}
                    className={`${can} border-hot bg-hot font-bold text-ink`}
                  >
                    {t("common.delete")}
                  </button>
                  <button type="button" onClick={() => setConfirmId(null)} className={`${can} text-white/60`}>
                    ✕
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => (lastCategory ? flash(t("content.lastCategory")) : setConfirmId(c.id))}
                  className={`${can} text-white/45 hover:border-hot hover:text-hot ${lastCategory ? "opacity-40" : ""}`}
                  title={t("content.deleteCategory")}
                >
                  ✕
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {editing ? (
        <CategoryEditor
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            flash(msg);
            loadCoverage();
          }}
        />
      ) : null}
    </div>
  );
}
