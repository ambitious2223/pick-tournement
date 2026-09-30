import { useState, type ReactNode } from "react";
import type { Item } from "../../shared/types.ts";
import { TextInput, Button } from "../ui/primitives.tsx";
import { uploadImage } from "../lib/live.ts";
import { slug } from "../lib/slug.ts";
import { useI18n } from "../i18n/index.tsx";

export function ItemRow({
  index,
  item,
  onChange,
}: {
  index: number;
  item: Item;
  onChange: (next: Item) => void;
}): ReactNode {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<Item>) => onChange({ ...item, ...patch });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      set({ image: url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-[2rem_1fr_1fr_5rem_auto] items-center gap-2 rounded-lg border border-line bg-ink-2 p-2">
      <span className="text-center text-xs text-white/40">{index + 1}</span>
      <TextInput placeholder={t("item.name")} value={item.name} onChange={(e) => set({ name: e.target.value })} />
      <TextInput
        placeholder={t("item.aliases")}
        value={item.aliases.join(", ")}
        onChange={(e) =>
          set({
            aliases: e.target.value
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean),
          })
        }
      />
      <TextInput
        placeholder="🙂"
        className="text-center"
        value={item.emoji ?? ""}
        onChange={(e) => set({ emoji: e.target.value || undefined })}
      />
      <div className="flex items-center gap-1">
        <label className="cursor-pointer rounded-lg border border-line px-2 py-1 text-xs hover:border-brand">
          {busy ? "…" : item.image ? "🖼" : t("item.photo")}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
        {item.image ? (
          <Button className="px-2 py-1 text-xs" onClick={() => set({ image: undefined })}>
            {t("common.clear")}
          </Button>
        ) : null}
      </div>
      {error ? <span className="col-span-5 text-xs text-hot">{error}</span> : null}
      <input type="hidden" value={slug(item.name)} readOnly />
    </div>
  );
}
