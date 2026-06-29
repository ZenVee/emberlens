export type GalleryOrientation = "portrait" | "landscape";

export const GALLERY_ORIENTATION_OPTIONS: { value: GalleryOrientation; label: string }[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Wide" },
];

export async function detectGalleryOrientation(file: File): Promise<GalleryOrientation> {
  const bitmap = await createImageBitmap(file);
  try {
    return bitmap.width > bitmap.height * 1.05 ? "landscape" : "portrait";
  } finally {
    bitmap.close();
  }
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
