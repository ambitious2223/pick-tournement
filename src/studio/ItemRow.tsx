import { useState, type ReactNode } from "react";
import type { Item } from "../../shared/types.ts";
import { TextInput, Button } from "../ui/primitives.tsx";
import { ImageCropModal } from "../ui/ImageCropModal.tsx";
import { uploadImage } from "../lib/live.ts";
import { slug } from "../lib/slug.ts";
import { useI18n } from "../i18n/index.tsx";
import { ItemVisual } from "../overlay/ItemVisual.tsx";

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
  const [pending, setPending] = useState<File | null>(null);

  const set = (patch: Partial<Item>) => onChange({ ...item, ...patch });

  const onFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      set({ image: url });
      setPending(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card card-hover flex min-w-0 flex-col gap-2 p-2.5">
      <div className="flex min-w-0 gap-3">
        <div className="relative shrink-0">
          <ItemVisual item={item} className="h-[4.5rem] w-[4.5rem]" emojiClassName="text-2xl" />
          <span className="absolute -top-1.5 -start-1.5 grid h-5 w-5 place-items-center rounded-full border border-line bg-ink text-[0.6rem] font-bold text-white/70">
            {index + 1}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <TextInput
            className="py-1.5"
            placeholder={t("item.name")}
            value={item.name}
            onChange={(e) => set({ name: e.target.value })}
          />
          <TextInput
            className="py-1.5"
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
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <label className="cursor-pointer rounded-lg border border-line px-2.5 py-1 text-xs text-white/70 transition hover:border-brand hover:text-brand">
          {busy ? "…" : item.image ? t("item.photo") + " ✓" : t("item.photo")}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => setPending(e.target.files?.[0] ?? null)}
          />
        </label>
        {item.image ? (
          <Button className="px-2 py-1 text-xs" onClick={() => set({ image: undefined })}>
            {t("item.clearPhoto")}
          </Button>
        ) : null}
        {error ? <span className="text-xs text-hot">{error}</span> : null}
      </div>

      <input type="hidden" value={slug(item.name)} readOnly />
      {pending ? (
        <ImageCropModal
          file={pending}
          onCancel={() => setPending(null)}
          onDone={(cropped) => void onFile(cropped)}
          busy={busy}
        />
      ) : null}
    </div>
  );
}
