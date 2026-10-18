import { useState, type ChangeEvent, type ReactNode } from "react";
import type { Category, Item } from "../../shared/types.ts";
import { TextInput, Button } from "../ui/primitives.tsx";
import { ImageCropModal, type CropOutcome } from "../ui/ImageCropModal.tsx";
import { ItemVisual } from "../overlay/ItemVisual.tsx";
import { send, uploadImage, fetchImageFromUrl } from "../lib/live.ts";
import { prepareImageFile } from "../lib/heic.ts";
import { slug } from "../lib/slug.ts";
import { useI18n } from "../i18n/index.tsx";

const MAX_ITEMS = 16;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif,image/heic,image/heif,.heic,.heif";

function blankItem(index: number): Item {
  return { id: `new-${Date.now().toString(36)}-${index}`, name: "", aliases: [] };
}

function isEmpty(item: Item): boolean {
  return !item.name.trim() && !item.image && !item.emoji && item.aliases.length === 0;
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
  const [cropFor, setCropFor] = useState<{ id: string; file: File } | null>(null);
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

  const uploadFor = async (id: string, outcome: CropOutcome): Promise<void> => {
    setBusyId(id);
    setError(null);
    try {
      const url = await uploadImage(outcome.file);
      setItem(id, { image: url });
      setCropFor(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const onPick = async (id: string, e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusyId(id);
    try {
      setCropFor({ id, file: await prepareImageFile(file) });
    } catch (err) {
      setError((err as Error).message);
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
        name: draft.name.trim() || "Category",
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
          placeholder={t("content.categoryName")}
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
        <ul className="mx-auto grid max-w-5xl gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {draft.items.map((item, index) => {
            const busy = busyId === item.id;
            const linking = linkFor === item.id;
            return (
              <li key={item.id} className="card flex flex-col gap-2 p-2.5">
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <ItemVisual item={item} className="h-20 w-20" emojiClassName="text-3xl" />
                    <span className="absolute -top-1.5 -start-1.5 grid h-5 w-5 place-items-center rounded-full border border-line bg-ink text-[0.6rem] font-bold text-white/70">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <TextInput
                      className="py-1.5"
                      value={item.name}
                      onChange={(e) => setItem(item.id, { name: e.target.value })}
                      placeholder={t("content.competitorName")}
                    />
                    <TextInput
                      className="py-1.5"
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
                    className="shrink-0 self-start rounded-lg border border-line px-2 py-1 text-xs text-white/45 transition hover:border-hot hover:text-hot"
                    title={t("content.remove")}
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <label className="relative inline-flex cursor-pointer items-center rounded-lg border border-line px-2 py-0.5 text-[0.65rem] font-semibold text-white/70 transition hover:border-brand hover:text-brand">
                    {busy ? "…" : t("content.uploadPhoto")}
                    <input
                      type="file"
                      accept={ACCEPT}
                      disabled={busy}
                      onChange={(e) => void onPick(item.id, e)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkFor(linking ? null : item.id);
                      setLinkText(item.image ?? "");
                    }}
                    className={`rounded-lg border px-2 py-0.5 text-[0.65rem] transition ${
                      linking ? "border-brand text-brand" : "border-line text-white/60 hover:border-brand"
                    }`}
                  >
                    {t("content.photoUrl")}
                  </button>
                  {item.image ? (
                    <button
                      type="button"
                      onClick={() => setItem(item.id, { image: undefined })}
                      className="rounded-lg border border-line px-2 py-0.5 text-[0.65rem] text-white/60 transition hover:border-hot hover:text-hot"
                    >
                      {t("item.clearPhoto")}
                    </button>
                  ) : null}
                </div>

                {linking ? (
                  <div className="flex gap-1.5">
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

          <li>
            <button
              type="button"
              disabled={draft.items.length >= MAX_ITEMS}
              onClick={addItem}
              className="flex h-full min-h-[7rem] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-white/45 transition hover:border-brand hover:text-brand disabled:opacity-30"
            >
              <span className="text-2xl leading-none">＋</span>
              {t("content.addCompetitor")}
            </button>
          </li>
        </ul>
      </div>
      {cropFor ? (
        <ImageCropModal
          source={{ kind: "file", file: cropFor.file }}
          onCancel={() => setCropFor(null)}
          onDone={(outcome) => void uploadFor(cropFor.id, outcome)}
          uploadError={error}
          busy={busyId === cropFor.id}
        />
      ) : null}
    </div>
  );
}
