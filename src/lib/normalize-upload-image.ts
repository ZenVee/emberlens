const WATERMARK_SAFE_TYPES = new Set(["image/jpeg", "image/png"]);

function isSafeByExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext === "jpg" || ext === "jpeg" || ext === "png";
}

/** Converts WebP, HEIC, GIF, etc. to JPEG so server-side watermarking can decode the file. */
export async function normalizeUploadImage(file: File): Promise<File> {
  const type = file.type || "";
  if (WATERMARK_SAFE_TYPES.has(type)) return file;
  if (!type && isSafeByExtension(file.name)) return file;

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image for upload.");

    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error("Could not convert image for upload.")),
        "image/jpeg",
        0.92,
      );
    });

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}
