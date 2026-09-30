import { useRef, useState, type ReactNode } from "react";
import type { Category, Item, SessionState } from "../../shared/types.ts";
import { Panel, Button, TextInput } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { slug } from "../lib/slug.ts";
import { categoryName } from "../lib/selectors.ts";
import { ItemRow } from "./ItemRow.tsx";
import { useI18n } from "../i18n/index.tsx";

function blankItems(): Item[] {
  return Array.from({ length: 16 }, (_, i) => ({ id: `item-${i + 1}`, name: "", aliases: [] }));
}

function normalize(category: Category): Category {
  const items = [...category.items];
  while (items.length < 16) items.push({ id: `item-${items.length + 1}`, name: "", aliases: [] });
  return { ...category, items: items.slice(0, 16) };
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
      name: "New Category",
      nameAr: "فئة جديدة",
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
    setDraft(normalize(parsed));
    setSelectedId(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
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
        <ul className="flex flex-col gap-1">
          {state.categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => openCategory(c.id)}
                className={`w-full truncate rounded-lg px-3 py-2 text-start text-sm transition ${
                  selectedId === c.id ? "bg-brand/15 text-brand" : "hover:bg-surface"
                }`}
              >
                {categoryName(c, lang)}
                <span className="ms-2 text-xs text-white/40">{c.items.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={draft ? t("studio.editCategory") : t("studio.selectOrCreate")}>
        {draft ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <TextInput
                className="flex-1"
                value={lang === "ar" ? (draft.nameAr ?? draft.name ?? "") : draft.name}
                onChange={(e) =>
                  lang === "ar" ? setDraft({ ...draft, nameAr: e.target.value }) : setDraft({ ...draft, name: e.target.value })
                }
                placeholder={t("studio.categoryName")}
              />
              <div className="w-40 shrink-0">
                <TextInput
                  value={draft.giftPair?.[0]?.icon ?? "🌹"}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      giftPair: [
                        { id: "rose", name: "Rose", icon: e.target.value || "🌹" },
                        draft.giftPair?.[1] ?? { id: "tiktok", name: "TikTok", icon: "🎵" },
                      ],
                    })
                  }
                  placeholder={t("studio.leftGift")}
                />
              </div>
              <div className="w-40 shrink-0">
                <TextInput
                  value={draft.giftPair?.[1]?.icon ?? "🎵"}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      giftPair: [
                        draft.giftPair?.[0] ?? { id: "rose", name: "Rose", icon: "🌹" },
                        { id: "tiktok", name: "TikTok", icon: e.target.value || "🎵" },
                      ],
                    })
                  }
                  placeholder={t("studio.rightGift")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
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

            <div className="flex items-center gap-3">
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
        ) : (
          <p className="text-sm text-white/50">{t("studio.hint")}</p>
        )}
      </Panel>
    </div>
  );
}
