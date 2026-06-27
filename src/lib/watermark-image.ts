import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Image } from "imagescript";

import { uploadToFivemanage } from "./fivemanage";

const MAX_WATERMARK_PX = 2560;
const WATERMARK_PATH = fileURLToPath(
  new URL("../assets/watermark.png", import.meta.url),
);

let watermarkOverlayPromise: Promise<Image> | null = null;

function extensionForMime(mimeType: string): "png" | "jpg" {
  return mimeType === "image/png" ? "png" : "jpg";
}

function getWatermarkOverlay(): Promise<Image> {
  watermarkOverlayPromise ??= Image.decode(readFileSync(WATERMARK_PATH));
  return watermarkOverlayPromise;
}

function fitWithinMaxDimension(image: Image, maxPx: number): Image {
  const maxDim = Math.max(image.width, image.height);
  if (maxDim <= maxPx) return image;

  const scale = maxPx / maxDim;
  return image.resize(
    Math.max(1, Math.round(image.width * scale)),
    Math.max(1, Math.round(image.height * scale)),
  );
}

export async function applyStudioWatermark(
  imageBuffer: Buffer,
  mimeType = "image/jpeg",
): Promise<{ buffer: Buffer; mimeType: string }> {
  const decoded = await Image.decode(imageBuffer);
  const image = fitWithinMaxDimension(decoded, MAX_WATERMARK_PX);
  const overlay = await getWatermarkOverlay();

  const x = Math.round((image.width - overlay.width) / 2);
  const y = Math.round((image.height - overlay.height) / 2);
  image.composite(overlay, x, y);

  const ext = extensionForMime(mimeType);
  const encoded =
    ext === "png"
      ? await image.encode(1)
      : await image.encodeJPEG(82);

  return {
    buffer: Buffer.from(encoded),
    mimeType: ext === "png" ? "image/png" : "image/jpeg",
  };
}

export async function uploadWatermarkedToFivemanage(
  imageBuffer: Buffer,
  mimeType: string,
  options: { filename: string; photoId?: string; title?: string },
): Promise<string> {
  const watermarked = await applyStudioWatermark(imageBuffer, mimeType);
  const ext = extensionForMime(watermarked.mimeType);
  const uploaded = await uploadToFivemanage(watermarked.buffer, {
    filename: `${options.filename}.${ext}`,
    mimeType: watermarked.mimeType,
    path: "watermarked",
    metadata: {
      ...(options.photoId ? { photoId: options.photoId } : {}),
      ...(options.title ? { title: options.title } : {}),
    },
  });
  return uploaded.url;
}
