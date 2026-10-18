import { useRef, useState, type ReactNode } from "react";
import type { Category, Item, SessionState } from "../../shared/types.ts";
import { Panel, Button, TextInput } from "../ui/primitives.tsx";
import { ThumbMosaic } from "../ui/ThumbMosaic.tsx";
import { send } from "../lib/live.ts";
import { slug } from "../lib/slug.ts";
import { categoryName } from "../lib/selectors.ts";
import { ItemRow } from "./ItemRow.tsx";
import { ContentPanel } from "./ContentPanel.tsx";
import { useI18n } from "../i18n/index.tsx";

function blankItems(): Item[] {
  return Array.from({ length: 16 }, (_, i) => ({ id: `item-${i + 1}`, name: "", aliases: [] }));
}

function normalize(category: Category): Category {
  return { ...category, items: [...category.items].slice(0, 16) };
}

export function Studio({ state }: { state: SessionState | null }): ReactNode {
  const { t, lang } = useI18n();
  const [draft, setDraft] = useState<Category | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  if (!state) return <p className="text-white/50">{t("common.connecting")}</p>;

  const fetchPhotosFor = async (categoryId?: string) => {
    setFetching(true);
    setFetchMsg(null);
    try {
      const qs = categoryId ? `?category=${encodeURIComponent(categoryId)}` : "";
      const res = await fetch(`/api/photos/fetch${qs}`, { method: "POST" });
      const data = (await res.json()) as { changed?: number; skipped?: number; error?: string };
      if (!res.ok) setFetchMsg(t("studio.failed", { error: data.error ?? res.status }));
      else setFetchMsg(t("studio.fetchSummary", { changed: data.changed ?? 0, skipped: data.skipped ?? 0 }));
    } catch {
      setFetchMsg(t("studio.serverUnreachable"));
    } finally {
      setFetching(false);
      setTimeout(() => setFetchMsg(null), 6000);
    }
  };

  const openCategory = (id: string) => {
    const found = state.categories.find((c) => c.id === id) ?? null;
    setSelectedId(id);
    setDraft(found ? normalize(structuredClone(found)) : null);
  };

  const save = async (category: Category) => {
    const cleaned: Category = {
      ...category,
      lang: state.lang,
      id: category.id || slug(category.name),
      items: category.items.map((item, i) => ({
        ...item,
        id: item.id || slug(item.name) || `item-${i + 1}`,
      })),
    };
    await send("category:save", cleaned);
    setSelectedId(cleaned.id);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const newCategory = () => {
    const category: Category = {
      id: `new-${Date.now().toString(36)}`,
      name: t("content.defaultCategoryName"),
      lang: state.lang,
      items: blankItems(),
      giftPair: [
        { id: "rose", name: "Rose", icon: "🌹" },
        { id: "tiktok", name: "TikTok", icon: "🎵" },
      ],
    };
    setSelectedId(null);
    setDraft(category);
  };

  const exportCategory = () => {
    if (!draft) return;
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${draft.id || "category"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importCategory = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text) as Category;
    setDraft(normalize({ ...parsed, lang: state.lang }));
    setSelectedId(null);
  };

  const setGift = (index: 0 | 1, icon: string) => {
    if (!draft) return;
    const fallback = [
      { id: "rose", name: "Rose", icon: "🌹" },
      { id: "tiktok", name: "TikTok", icon: "🎵" },
    ] as const;
    const pair = [
      draft.giftPair?.[0] ?? fallback[0],
      draft.giftPair?.[1] ?? fallback[1],
    ] as [{ id: string; name: string; icon: string }, { id: string; name: string; icon: string }];
    pair[index] = { ...pair[index], icon: icon || fallback[index].icon };
    setDraft({ ...draft, giftPair: pair });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <Panel title={t("studio.categories")}>
        <div className="mb-3 flex gap-2">
          <Button variant="primary" className="flex-1" onClick={newCategory}>
            {t("studio.new")}
          </Button>
          <Button variant="ghost" onClick={() => importRef.current?.click()}>
            {t("studio.import")}
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => void importCategory(e.target.files?.[0])}
          />
        </div>
        <Button variant="hot" className="mb-3 w-full" disabled={fetching} onClick={() => void fetchPhotosFor()}>
          {fetching ? t("studio.fetching") : t("studio.fetchAll")}
        </Button>
        {fetchMsg ? <p className="mb-2 text-xs text-lime">{fetchMsg}</p> : null}
        {state.categories.length === 0 ? (
          <p className="text-xs text-white/40">{t("content.noCategories")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {state.categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => openCategory(c.id)}
                  className={`card card-hover flex w-full flex-col gap-2 p-2 text-start ${
                    selectedId === c.id ? "card-active" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <ThumbMosaic items={c.items} tileClass="h-6 w-6" />
                    <span className="rounded-full bg-ink/60 px-1.5 py-0.5 text-[0.6rem] text-white/50">{c.items.length}</span>
                  </div>
                  <span className="min-w-0 truncate text-xs font-semibold">{categoryName(c, lang)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={draft ? t("studio.editCategory") : t("studio.selectOrCreate")}>
        {draft ? (
          <div className="flex flex-col gap-4">
            <div className="card flex flex-wrap items-center gap-3 p-3">
              <TextInput
                className="min-w-[12rem] flex-1"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder={t("studio.categoryName")}
              />
              <div className="card flex items-center gap-2 px-2.5 py-1.5">
                <span className="text-xl leading-none">{draft.giftPair?.[0]?.icon ?? "🌹"}</span>
                <input
                  className="w-12 rounded-lg border border-line bg-ink-2 px-2 py-1 text-center text-lg outline-none focus:border-brand"
                  value={draft.giftPair?.[0]?.icon ?? "🌹"}
                  onChange={(e) => setGift(0, e.target.value)}
                  aria-label={t("studio.leftGift")}
                />
                <span className="text-[0.65rem] text-white/50">{t("studio.leftGift")}</span>
              </div>
              <div className="card flex items-center gap-2 px-2.5 py-1.5">
                <span className="text-xl leading-none">{draft.giftPair?.[1]?.icon ?? "🎵"}</span>
                <input
                  className="w-12 rounded-lg border border-line bg-ink-2 px-2 py-1 text-center text-lg outline-none focus:border-brand"
                  value={draft.giftPair?.[1]?.icon ?? "🎵"}
                  onChange={(e) => setGift(1, e.target.value)}
                  aria-label={t("studio.rightGift")}
                />
                <span className="text-[0.65rem] text-white/50">{t("studio.rightGift")}</span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {draft.items.map((item, i) => (
                <ItemRow
                  key={i}
                  index={i}
                  item={item}
                  onChange={(next) => {
                    const items = [...draft.items];
                    items[i] = next;
                    setDraft({ ...draft, items });
                  }}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="lime" onClick={() => void save(draft)}>
                {t("studio.saveCategory")}
              </Button>
              <Button variant="ghost" disabled={fetching} onClick={() => void fetchPhotosFor(draft.id)}>
                {fetching ? t("studio.fetching") : t("studio.fetchPhotos")}
              </Button>
              <Button variant="ghost" onClick={exportCategory}>
                {t("studio.exportJson")}
              </Button>
              {selectedId ? (
                <Button
                  variant="danger"
                  onClick={() => {
                    void send("category:delete", selectedId);
                    setSelectedId(null);
                  }}
                >
                  {t("common.delete")}
                </Button>
              ) : null}
              {savedFlash ? <span className="text-sm text-lime">{t("common.saved")}</span> : null}
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel title={t("studio.content")} className="lg:col-span-2">
        <ContentPanel state={state} />
      </Panel>
    </div>
  );
}
