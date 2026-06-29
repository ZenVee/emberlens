import jpeg from "jpeg-js";
import { PNG } from "pngjs";

import watermarkBase64 from "../assets/watermark.png?inline";
import { uploadToFivemanage } from "./fivemanage";

const MAX_WATERMARK_PX = 2560;

type RgbaImage = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

let watermarkOverlay: RgbaImage | null = null;

function extensionForMime(mimeType: string): "png" | "jpg" {
  return mimeType === "image/png" ? "png" : "jpg";
}

function decodeInlineAsset(inline: string): Buffer {
  const base64 = inline.includes(",") ? inline.slice(inline.indexOf(",") + 1) : inline;
  return Buffer.from(base64, "base64");
}

function getWatermarkOverlay(): RgbaImage {
  if (watermarkOverlay) return watermarkOverlay;

  const png = PNG.sync.read(decodeInlineAsset(watermarkBase64));
  watermarkOverlay = {
    data: new Uint8ClampedArray(png.data),
    width: png.width,
    height: png.height,
  };
  return watermarkOverlay;
}

function fitWithinMaxDimension(image: RgbaImage, maxPx: number): RgbaImage {
  const maxDim = Math.max(image.width, image.height);
  if (maxDim <= maxPx) return image;

  const width = Math.max(1, Math.round((image.width * maxPx) / maxDim));
  const height = Math.max(1, Math.round((image.height * maxPx) / maxDim));
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = Math.min(image.width - 1, Math.floor((x * image.width) / width));
      const srcY = Math.min(image.height - 1, Math.floor((y * image.height) / height));
      const srcI = (srcY * image.width + srcX) * 4;
      const dstI = (y * width + x) * 4;
      data[dstI] = image.data[srcI];
      data[dstI + 1] = image.data[srcI + 1];
      data[dstI + 2] = image.data[srcI + 2];
      data[dstI + 3] = image.data[srcI + 3];
    }
  }

  return { data, width, height };
}

function isPngBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  );
}

function decodeImageBuffer(imageBuffer: Buffer, mimeType: string): RgbaImage {
  if (mimeType === "image/png" || isPngBuffer(imageBuffer)) {
    const png = PNG.sync.read(imageBuffer);
    return {
      data: new Uint8ClampedArray(png.data),
      width: png.width,
      height: png.height,
    };
  }

  const decoded = jpeg.decode(imageBuffer, { useTArray: true });
  return {
    data: new Uint8ClampedArray(decoded.data),
    width: decoded.width,
    height: decoded.height,
  };
}

function compositeCenter(base: RgbaImage, overlay: RgbaImage): RgbaImage {
  const data = new Uint8ClampedArray(base.data);
  const x0 = Math.round((base.width - overlay.width) / 2);
  const y0 = Math.round((base.height - overlay.height) / 2);

  for (let oy = 0; oy < overlay.height; oy++) {
    for (let ox = 0; ox < overlay.width; ox++) {
      const bx = x0 + ox;
      const by = y0 + oy;
      if (bx < 0 || by < 0 || bx >= base.width || by >= base.height) continue;

      const oi = (oy * overlay.width + ox) * 4;
      const alpha = overlay.data[oi + 3] / 255;
      if (alpha <= 0) continue;

      const bi = (by * base.width + bx) * 4;
      const inv = 1 - alpha;
      data[bi] = Math.round(overlay.data[oi] * alpha + data[bi] * inv);
      data[bi + 1] = Math.round(overlay.data[oi + 1] * alpha + data[bi + 1] * inv);
      data[bi + 2] = Math.round(overlay.data[oi + 2] * alpha + data[bi + 2] * inv);
      data[bi + 3] = Math.round(overlay.data[oi + 3] + data[bi + 3] * inv);
    }
  }

  return { data, width: base.width, height: base.height };
}

function encodeImage(image: RgbaImage, mimeType: string): { buffer: Buffer; mimeType: string } {
  if (mimeType === "image/png") {
    const png = new PNG({ width: image.width, height: image.height });
    png.data = Buffer.from(image.data);
    return { buffer: PNG.sync.write(png), mimeType: "image/png" };
  }

  const encoded = jpeg.encode({ data: image.data, width: image.width, height: image.height }, 82);
  return { buffer: Buffer.from(encoded.data), mimeType: "image/jpeg" };
}

export function applyStudioWatermark(
  imageBuffer: Buffer,
  mimeType = "image/jpeg",
): { buffer: Buffer; mimeType: string } {
  const decoded = decodeImageBuffer(imageBuffer, mimeType);
  const image = fitWithinMaxDimension(decoded, MAX_WATERMARK_PX);
  const overlay = getWatermarkOverlay();
  const composited = compositeCenter(image, overlay);
  return encodeImage(composited, mimeType);
}

export async function uploadWatermarkedToFivemanage(
  imageBuffer: Buffer,
  mimeType: string,
  options: { filename: string; photoId?: string; title?: string },
): Promise<string> {
  const watermarked = applyStudioWatermark(imageBuffer, mimeType);
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

function mimeTypeFromUrl(url: string): string | undefined {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path.endsWith(".png")) return "image/png";
    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  } catch {
    const path = url.split("?")[0]?.toLowerCase() ?? "";
    if (path.endsWith(".png")) return "image/png";
    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  }
  return undefined;
}

function inferImageMimeType(buffer: Buffer, hint?: string): string {
  if (hint === "image/png" || isPngBuffer(buffer)) return "image/png";
  return "image/jpeg";
}

export async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download image (${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const headerMime = response.headers.get("content-type")?.split(";")[0].trim();
  const mimeType =
    headerMime && headerMime.startsWith("image/")
      ? headerMime
      : inferImageMimeType(buffer, mimeTypeFromUrl(url));

  return { buffer, mimeType };
}
