import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import type { CropMode, CropRect } from "../../shared/types.ts";
import { readFileAsDataUrl, cropImageToFile, stretchImageToFile, outputMimeFor } from "../lib/crop.ts";
import { Button } from "./primitives.tsx";
import { useI18n } from "../i18n/index.tsx";

export type CropSource =
  | { kind: "file"; file: File }
  | { kind: "url"; url: string; type?: string };

export interface CropOutcome {
  file: File;
  crop: CropRect;
  mode: CropMode;
}

const FULL_CROP: CropRect = { x: 0, y: 0, width: 100, height: 100 };

function guessType(url: string): string {
  const clean = url.split("?")[0]?.toLowerCase() ?? "";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export function ImageCropModal({
  source,
  initialCrop,
  initialMode = "crop",
  onCancel,
  onDone,
  uploadError = null,
  busy = false,
}: {
  source: CropSource;
  initialCrop?: CropRect;
  initialMode?: CropMode;
  onCancel: () => void;
  onDone: (outcome: CropOutcome) => void;
  uploadError?: string | null;
  busy?: boolean;
}): ReactNode {
  const { t } = useI18n();
  const [image, setImage] = useState<string | null>(null);
  const [mode, setMode] = useState<CropMode>(initialMode);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<{ pct: Area; px: Area } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stretchSide, setStretchSide] = useState(0);
  const stretchRef = useRef<HTMLDivElement>(null);

  const sourceType = source.kind === "file" ? source.file.type : source.type ?? guessType(source.url);
  const restore = mode === "crop" ? area?.pct ?? initialCrop : undefined;

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      if (source.kind === "file") {
        const url = await readFileAsDataUrl(source.file);
        if (active) setImage(url);
      } else if (active) {
        setImage(source.url);
      }
    };
    load().catch((e: Error) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [source]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (mode !== "stretch" || !stretchRef.current) return;
    const el = stretchRef.current;
    const update = (): void => setStretchSide(Math.min(el.clientWidth, el.clientHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode, image]);

  const apply = async (): Promise<void> => {
    if (!image) return;
    if (mode === "crop" && !area) return;
    setError(null);
    try {
      const mime = outputMimeFor(sourceType);
      if (mode === "stretch") {
        const file = await stretchImageToFile(image, { mime });
        onDone({ file, crop: FULL_CROP, mode });
      } else {
        const file = await cropImageToFile(image, area!.px, { mime });
        onDone({ file, crop: area!.pct, mode });
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const shown = error ?? uploadError;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/95 text-white">
      <header className="flex flex-col gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold">{t("crop.title")}</h2>
          <div className="flex rounded-lg border border-line p-0.5 text-xs">
            {(["crop", "stretch"] as const).map((m) => (
              <button
                key={m}
                type="button"
                disabled={busy}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 font-semibold transition disabled:opacity-40 ${
                  mode === m ? "bg-brand text-ink" : "text-white/60 hover:text-white"
                }`}
              >
                {t(m === "crop" ? "crop.mode.crop" : "crop.mode.stretch")}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/50">{t(mode === "crop" ? "crop.hint" : "crop.stretchHint")}</p>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {image && mode === "crop" ? (
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            restrictPosition
            initialCroppedAreaPercentages={restore}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(croppedArea, croppedAreaPixels) => {
              setArea({ pct: croppedArea, px: croppedAreaPixels });
            }}
          />
        ) : null}
        {image && mode === "stretch" ? (
          <div ref={stretchRef} className="grid h-full w-full place-items-center p-4">
            <div
              className="overflow-hidden rounded-xl border border-line"
              style={{ width: stretchSide, height: stretchSide }}
            >
              <img src={image} alt="" className="h-full w-full object-fill" />
            </div>
          </div>
        ) : null}
      </div>

      {shown ? <p className="px-4 py-1 text-xs text-hot">{shown}</p> : null}

      <footer className="flex items-center gap-3 border-t border-line px-4 py-3">
        {mode === "crop" ? (
          <label className="flex flex-1 items-center gap-2 text-xs">
            <span className="shrink-0 text-white/50">{t("crop.zoom")}</span>
            <input
              type="range"
              dir="ltr"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-brand"
            />
          </label>
        ) : (
          <span className="flex-1 text-xs text-white/40">{t("crop.stretchHint")}</span>
        )}
        <Button variant="ghost" disabled={busy} onClick={onCancel}>
          {t("crop.cancel")}
        </Button>
        <Button
          variant="primary"
          disabled={busy || !image || (mode === "crop" && !area)}
          onClick={() => void apply()}
        >
          {busy ? "…" : t(mode === "stretch" ? "crop.stretchApply" : "crop.apply")}
        </Button>
      </footer>
    </div>,
    document.body,
  );
}
