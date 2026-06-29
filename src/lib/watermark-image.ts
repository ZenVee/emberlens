import { decode as decodeWebp } from "@jsquash/webp";
import { Image } from "imagescript";

import watermarkBase64 from "../assets/watermark.png?inline";
import { uploadToFivemanage } from "./fivemanage";

const MAX_WATERMARK_PX = 2560;

let watermarkOverlayPromise: Promise<Image> | null = null;

function extensionForMime(mimeType: string): "png" | "jpg" {
  return mimeType === "image/png" ? "png" : "jpg";
}

function decodeInlineAsset(inline: string): Buffer {
  const base64 = inline.includes(",") ? inline.slice(inline.indexOf(",") + 1) : inline;
  return Buffer.from(base64, "base64");
}

function getWatermarkOverlay(): Promise<Image> {
  watermarkOverlayPromise ??= Promise.resolve().then(() =>
    Image.decode(decodeInlineAsset(watermarkBase64)),
  );
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

function isWebpBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  );
}

async function decodeImageBuffer(imageBuffer: Buffer): Promise<Image> {
  try {
    return await Image.decode(imageBuffer);
  } catch (error) {
    if (!isWebpBuffer(imageBuffer)) throw error;

    const imageData = await decodeWebp(
      imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength,
      ),
    );
    const image = new Image(imageData.width, imageData.height);
    image.bitmap.set(imageData.data);
    return image;
  }
}

export async function applyStudioWatermark(
  imageBuffer: Buffer,
  mimeType = "image/jpeg",
): Promise<{ buffer: Buffer; mimeType: string }> {
  const decoded = await decodeImageBuffer(imageBuffer);
  const image = fitWithinMaxDimension(decoded, MAX_WATERMARK_PX);
  const overlay = await getWatermarkOverlay();

  const x = Math.round((image.width - overlay.width) / 2);
  const y = Math.round((image.height - overlay.height) / 2);
  image.composite(overlay, x, y);

  const ext = extensionForMime(mimeType);
  const encoded = ext === "png" ? await image.encode(1) : await image.encodeJPEG(82);

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
