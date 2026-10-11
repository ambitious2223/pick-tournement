import { useEffect, useRef, useState, type ReactNode } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { readFileAsDataUrl, cropImageToFile } from "../lib/crop.ts";
import { Button } from "./primitives.tsx";
import { useI18n } from "../i18n/index.tsx";

export function ImageCropModal({
  file,
  onCancel,
  onDone,
  busy = false,
}: {
  file: File;
  onCancel: () => void;
  onDone: (file: File) => void;
  busy?: boolean;
}): ReactNode {
  const { t } = useI18n();
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const pixels = useRef<Area | null>(null);

  useEffect(() => {
    let active = true;
    readFileAsDataUrl(file)
      .then((url) => {
        if (active) setImage(url);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [file]);

  const apply = async (): Promise<void> => {
    if (!image || !pixels.current) return;
    setError(null);
    try {
      const cropped = await cropImageToFile(image, pixels.current);
      onDone(cropped);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/95 text-white">
      <header className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold">{t("crop.title")}</h2>
        <p className="text-xs text-white/50">{t("crop.hint")}</p>
      </header>

      <div className="relative flex-1">
        {image ? (
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, areaPixels) => {
              pixels.current = areaPixels;
            }}
          />
        ) : null}
      </div>

      {error ? <p className="px-4 py-1 text-xs text-hot">{error}</p> : null}

      <footer className="flex items-center gap-3 border-t border-line px-4 py-3">
        <label className="flex flex-1 items-center gap-2 text-xs">
          <span className="shrink-0 text-white/50">{t("crop.zoom")}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer accent-brand"
          />
        </label>
        <Button variant="ghost" onClick={onCancel}>
          {t("crop.cancel")}
        </Button>
        <Button variant="primary" disabled={busy || !pixels.current} onClick={() => void apply()}>
          {busy ? "…" : t("crop.apply")}
        </Button>
      </footer>
    </div>
  );
}
