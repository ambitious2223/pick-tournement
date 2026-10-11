export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string), { once: true });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Could not read file")), { once: true });
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!/^(data:|blob:|\/)/.test(src)) img.crossOrigin = "anonymous";
    img.addEventListener("load", () => resolve(img), { once: true });
    img.addEventListener("error", () => reject(new Error("Could not load image")), { once: true });
    img.src = src;
  });
}

export async function cropImageToFile(
  src: string,
  area: { x: number; y: number; width: number; height: number },
  opts?: { size?: number; mime?: string; quality?: number },
): Promise<File> {
  const size = opts?.size ?? 512;
  const mime = opts?.mime ?? "image/jpeg";
  const quality = opts?.quality ?? 0.92;
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
  if (!blob) throw new Error("Could not create image");
  const ext = mime === "image/png" ? "png" : "jpg";
  return new File([blob], `crop-${Date.now()}.${ext}`, { type: mime });
}
