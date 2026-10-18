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

function toBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create image"))), mime, quality);
  });
}

export function outputMimeFor(sourceType: string): string {
  const type = sourceType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  return "image/jpeg";
}

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function toMasterFile(file: File, maxEdge = 3000, maxBytes = 4 * 1024 * 1024): Promise<File> {
  if (file.type === "image/gif") return file;
  const src = await readFileAsDataUrl(file);
  const img = await loadImage(src);
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= maxEdge && file.size <= maxBytes) return file;
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);
  const mime = outputMimeFor(file.type);
  const blob = await toBlob(canvas, mime, 0.9);
  return new File([blob], `master-${Date.now()}.${extFor(mime)}`, { type: mime });
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
  const blob = await toBlob(canvas, mime, quality);
  return new File([blob], `crop-${Date.now()}.${extFor(mime)}`, { type: mime });
}

export async function stretchImageToFile(
  src: string,
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
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, size, size);
  const blob = await toBlob(canvas, mime, quality);
  return new File([blob], `stretch-${Date.now()}.${extFor(mime)}`, { type: mime });
}
