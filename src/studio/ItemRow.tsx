import { useState, type ChangeEvent, type ReactNode } from "react";
import type { Item } from "../../shared/types.ts";
import { TextInput, Button } from "../ui/primitives.tsx";
import { ImageCropModal, type CropOutcome } from "../ui/ImageCropModal.tsx";
import { uploadImage } from "../lib/live.ts";
import { toMasterFile } from "../lib/crop.ts";
import { prepareImageFile } from "../lib/heic.ts";
import { slug } from "../lib/slug.ts";
import { useI18n } from "../i18n/index.tsx";
import { ItemVisual } from "../overlay/ItemVisual.tsx";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif,image/heic,image/heif,.heic,.heif";

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
  const [editing, setEditing] = useState(false);

  const set = (patch: Partial<Item>) => onChange({ ...item, ...patch });

  const uploadNew = async (outcome: CropOutcome): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const master = await toMasterFile(pending!);
      const [originalUrl, croppedUrl] = await Promise.all([uploadImage(master), uploadImage(outcome.file)]);
      set({ image: croppedUrl, imageOriginal: originalUrl, imageCrop: outcome.crop, imageCropMode: outcome.mode });
      setPending(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const uploadEdit = async (outcome: CropOutcome): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const croppedUrl = await uploadImage(outcome.file);
      set({ image: croppedUrl, imageCrop: outcome.crop, imageCropMode: outcome.mode });
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onPick = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      setPending(await prepareImageFile(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card card-hover flex min-w-0 flex-col gap-2 p-2.5">
      <div className="flex min-w-0 gap-3">
        <div className="relative shrink-0">
          <label className="relative block cursor-pointer" title={t("item.photo")}>
            <ItemVisual item={item} className="h-[4.5rem] w-[4.5rem]" emojiClassName="text-2xl" />
            <input
              type="file"
              accept={ACCEPT}
              disabled={busy}
              onChange={(e) => void onPick(e)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
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
        <label className="relative inline-flex cursor-pointer items-center rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-white/80 transition hover:border-brand hover:text-brand">
          {busy ? "…" : item.image ? `${t("item.photo")} ✓` : t("item.photo")}
          <input
            type="file"
            accept={ACCEPT}
            disabled={busy}
            onChange={(e) => void onPick(e)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        {item.image ? (
          <>
            <Button
              className="px-2 py-1 text-xs"
              disabled={busy}
              onClick={() => {
                setError(null);
                setEditing(true);
              }}
            >
              {t("item.editCrop")}
            </Button>
            <Button
              className="px-2 py-1 text-xs"
              onClick={() =>
                set({ image: undefined, imageOriginal: undefined, imageCrop: undefined, imageCropMode: undefined })
              }
            >
              {t("item.clearPhoto")}
            </Button>
          </>
        ) : null}
        {error && !pending && !editing ? <span className="text-xs text-hot">{error}</span> : null}
      </div>

      <input type="hidden" value={slug(item.name)} readOnly />
      {pending ? (
        <ImageCropModal
          source={{ kind: "file", file: pending }}
          onCancel={() => setPending(null)}
          onDone={(outcome) => void uploadNew(outcome)}
          uploadError={error}
          busy={busy}
        />
      ) : null}
      {editing && item.image ? (
        <ImageCropModal
          source={{ kind: "url", url: item.imageOriginal ?? item.image }}
          initialCrop={item.imageOriginal ? item.imageCrop : undefined}
          initialMode={item.imageCropMode ?? "crop"}
          onCancel={() => setEditing(false)}
          onDone={(outcome) => void uploadEdit(outcome)}
          uploadError={error}
          busy={busy}
        />
      ) : null}
    </div>
  );
}
