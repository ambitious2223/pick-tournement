/**
 * Phone photos (iPhone HEIC/HEIF) are not decodable by desktop browsers, so we
 * convert them to JPEG before the crop dialog. The HEIC decoder is imported
 * lazily so its size only counts when someone actually picks a HEIC file.
 */
export async function prepareImageFile(file: File): Promise<File> {
  const name = file.name.toLowerCase();
  const maybeHeic =
    /image\/hei[cf]/i.test(file.type) || name.endsWith(".heic") || name.endsWith(".heif");
  if (!maybeHeic) return file;

  const { isHeic, heicTo } = await import("heic-to/csp");
  if (!(await isHeic(file))) return file;

  const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
  const base = name.replace(/\.(heic|heif)$/i, "") || "photo";
  return new File([jpeg], `${base}.jpg`, { type: "image/jpeg" });
}
