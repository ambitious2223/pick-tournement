import { useState, type ReactNode } from "react";
import type { Category, Item } from "../../shared/types.ts";
import { TextInput, Button } from "../ui/primitives.tsx";
import { send, uploadImage, fetchImageFromUrl } from "../lib/live.ts";
import { slug } from "../lib/slug.ts";
import { useI18n } from "../i18n/index.tsx";

const MAX_ITEMS = 16;

function blankItem(index: number): Item {
  return { id: `new-${Date.now().toString(36)}-${index}`, name: "", aliases: [] };
}

function isEmpty(item: Item): boolean {
  return !item.name.trim() && !item.nameAr?.trim() && !item.image && !item.emoji && item.aliases.length === 0;
}

/**
 * The full-screen category editor. Keeps a local draft so nothing is written
 * until Save; competitor ids are preserved so a running bracket stays valid.
 */
export function CategoryEditor({
  category,
  onClose,
  onSaved,
}: {
  category: Category;
  onClose: () => void;
  onSaved: (message: string) => void;
}): ReactNode {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Category>(() => structuredClone(category));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [linkFor, setLinkFor] = useState<string | null>(null);
  const [linkText, setLinkText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setItem = (id: string, patch: Partial<Item>): void =>
    setDraft({ ...draft, items: draft.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });

  const addItem = (): void => {
    if (draft.items.length >= MAX_ITEMS) {
      setError(t("content.maxItems"));
      return;
    }
    setDraft({ ...draft, items: [...draft.items, blankItem(draft.items.length)] });
  };

  const removeItem = (id: string): void => {
    if (draft.items.length <= 1) {
      setError(t("content.lastItem"));
      return;
    }
    setDraft({ ...draft, items: draft.items.filter((item) => item.id !== id) });
  };

  const uploadFor = async (id: string, file: File | undefined): Promise<void> => {
    if (!file) return;
    setBusyId(id);
    setError(null);
    try {
      const url = await uploadImage(file);
      setItem(id, { image: url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const fetchLink = async (id: string): Promise<void> => {
    const url = linkText.trim();
    if (!url) return;
    setBusyId(id);
    setError(null);
    try {
      const local = await fetchImageFromUrl(url);
      setItem(id, { image: local });
      setLinkFor(null);
      setLinkText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      const used = new Set<string>();
      const items: Item[] = draft.items
        .filter((item) => !isEmpty(item))
        .map((item, i) => {
          let id = item.id && !item.id.startsWith("new-") ? item.id : slug(item.name) || `item-${i + 1}`;
          while (used.has(id)) id = `${id}-${i + 1}`;
          used.add(id);
          return { ...item, id, name: item.name.trim() };
        });
      if (items.length === 0) {
        setError(t("content.lastItem"));
        return;
      }
      const cleaned: Category = {
        ...draft,
        id:
          draft.id && !draft.id.startsWith("new-")
            ? draft.id
            : slug(draft.name) || `category-${Date.now().toString(36)}`,
        name: draft.name.trim() || draft.nameAr?.trim() || "Category",
        items,
      };
      await send("category:save", cleaned);
      onSaved(t("content.saved"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-white">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-line bg-ink-2 px-3 py-1.5 text-sm font-bold outline-none focus:border-brand"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder={t("content.categoryNameEn")}
        />
        <input
          className="min-w-0 flex-1 rounded-lg border border-line bg-ink-2 px-3 py-1.5 text-sm font-bold outline-none focus:border-brand"
          value={draft.nameAr ?? ""}
          onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })}
          placeholder={t("content.categoryNameAr")}
        />
        <span className="shrink-0 text-[0.65rem] text-white/40">
          {draft.items.length}/{MAX_ITEMS}
        </span>
        <Button variant="lime" disabled={saving} onClick={() => void save()}>
          {saving ? t("content.saving") : t("common.save")}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {t("common.close")}
        </Button>
      </header>

      {error ? <p className="border-b border-hot/40 bg-hot/10 px-3 py-1.5 text-xs text-hot">{error}</p> : null}

      <div className="scroll-thin flex-1 overflow-y-auto p-3">
        <ul className="mx-auto flex max-w-4xl flex-col gap-2">
          {draft.items.map((item, index) => {
            const busy = busyId === item.id;
            const linking = linkFor === item.id;
            return (
              <li key={item.id} className="rounded-xl border border-line bg-ink-2 p-2">
                <div className="flex gap-2">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-ink text-center text-xs text-white/35">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl">{item.emoji || index + 1}</span>
                    )}
                  </div>
                  <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-2">
                    <TextInput
                      value={item.name}
                      onChange={(e) => setItem(item.id, { name: e.target.value })}
                      placeholder={t("content.competitorNameEn")}
                    />
                    <TextInput
                      value={item.nameAr ?? ""}
                      onChange={(e) => setItem(item.id, { nameAr: e.target.value })}
                      placeholder={t("content.competitorNameAr")}
                    />
                    <TextInput
                      className="sm:col-span-2"
                      value={item.aliases.join(", ")}
                      onChange={(e) =>
                        setItem(item.id, {
                          aliases: e.target.value
                            .split(",")
                            .map((a) => a.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder={t("content.aliases")}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 self-start rounded border border-line px-2 py-1 text-xs text-white/45 transition hover:border-hot hover:text-hot"
                    title={t("content.remove")}
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <label className="cursor-pointer rounded border border-line px-2 py-0.5 text-[0.65rem] text-white/60 transition hover:border-brand">
                    {busy ? "…" : t("content.uploadPhoto")}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={(e) => void uploadFor(item.id, e.target.files?.[0])}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkFor(linking ? null : item.id);
                      setLinkText(item.image ?? "");
                    }}
                    className={`rounded border px-2 py-0.5 text-[0.65rem] transition ${
                      linking ? "border-brand text-brand" : "border-line text-white/60 hover:border-brand"
                    }`}
                  >
                    {t("content.photoUrl")}
                  </button>
                  {item.image ? (
                    <button
                      type="button"
                      onClick={() => setItem(item.id, { image: undefined })}
                      className="rounded border border-line px-2 py-0.5 text-[0.65rem] text-white/60 transition hover:border-hot hover:text-hot"
                    >
                      {t("item.clearPhoto")}
                    </button>
                  ) : null}
                  <input
                    className="w-20 rounded border border-line bg-ink px-2 py-0.5 text-center text-sm outline-none focus:border-brand"
                    value={item.emoji ?? ""}
                    onChange={(e) => setItem(item.id, { emoji: e.target.value || undefined })}
                    placeholder="🙂"
                  />
                </div>

                {linking ? (
                  <div className="mt-1.5 flex gap-1.5">
                    <TextInput
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="https://…"
                      className="py-1 text-xs"
                    />
                    <Button
                      variant="primary"
                      className="shrink-0 px-2 py-1 text-xs"
                      disabled={busy}
                      onClick={() => void fetchLink(item.id)}
                    >
                      {busy ? "…" : t("content.fetchUrl")}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-3 flex max-w-4xl">
          <Button
            variant="ghost"
            className="w-full"
            disabled={draft.items.length >= MAX_ITEMS}
            onClick={addItem}
          >
            {t("content.addCompetitor")}
          </Button>
        </div>
      </div>
    </div>
  );
}
