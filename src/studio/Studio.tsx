import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Category, Item, SessionState } from "../../shared/types.ts";
import { Panel, Button, TextInput } from "../ui/primitives.tsx";
import { send } from "../lib/live.ts";
import { slug } from "../lib/slug.ts";
import { ItemRow } from "./ItemRow.tsx";

function blankItems(): Item[] {
  return Array.from({ length: 16 }, (_, i) => ({ id: `item-${i + 1}`, name: "", aliases: [] }));
}

function normalize(category: Category): Category {
  const items = [...category.items];
  while (items.length < 16) items.push({ id: `item-${items.length + 1}`, name: "", aliases: [] });
  return { ...category, items: items.slice(0, 16) };
}

export function Studio({ state }: { state: SessionState | null }): ReactNode {
  const [draft, setDraft] = useState<Category | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) return;
    const found = state.categories.find((c) => c.id === selectedId) ?? null;
    setDraft(found ? normalize(structuredClone(found)) : null);
  }, [selectedId, state]);

  if (!state) return <p className="text-white/50">Connecting…</p>;

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
      <Panel title="Categories">
        <div className="mb-3 flex gap-2">
          <Button variant="primary" className="flex-1" onClick={newCategory}>
            + New
          </Button>
          <Button variant="ghost" onClick={() => importRef.current?.click()}>
            Import
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => void importCategory(e.target.files?.[0])}
          />
        </div>
        <ul className="flex flex-col gap-1">
          {state.categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelectedId(c.id)}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedId === c.id ? "bg-brand/15 text-brand" : "hover:bg-surface"
                }`}
              >
                {c.name}
                <span className="ml-2 text-xs text-white/40">{c.items.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={draft ? "Edit category" : "Select or create a category"}>
        {draft ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <TextInput
                className="flex-1"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Category name"
              />
              <TextInput
                className="w-40"
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
                placeholder="left gift"
              />
              <TextInput
                className="w-40"
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
                placeholder="right gift"
              />
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
                Save category
              </Button>
              <Button variant="ghost" onClick={exportCategory}>
                Export JSON
              </Button>
              {selectedId ? (
                <Button
                  variant="danger"
                  onClick={() => {
                    void send("category:delete", selectedId);
                    setSelectedId(null);
                  }}
                >
                  Delete
                </Button>
              ) : null}
              {savedFlash ? <span className="text-sm text-lime">Saved ✓</span> : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/50">
            Pick a category on the left, or create a new one. Each category holds 16 items with a name, aliases for chat
            matching, an emoji fallback, and an optional photo.
          </p>
        )}
      </Panel>
    </div>
  );
}
