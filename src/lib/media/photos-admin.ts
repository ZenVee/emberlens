import { createServerFn } from "@tanstack/react-start";

import { requireAdmin } from "../admin";
import { deleteFromFivemanage, uploadToFivemanage } from "../fivemanage";
import type { DbPhoto } from "../media-types";
import { zodValidator } from "../schemas/parse";
import {
  bulkDeletePhotosSchema,
  bulkUpdatePhotosSchema,
  idSchema,
  uploadPhotoSchema,
  updatePhotoSchema,
} from "../schemas/media";
import { getSupabaseServerClient } from "../supabase";
import { deletePhotosWithAssets, linkPhotoToProject } from "./photo-assets";
import {
  extensionForMime,
  MAX_UPLOAD_BYTES,
  PHOTO_SELECT,
  resolveFolderId,
  validatePhotoCategory,
} from "./shared";

export const uploadPhoto = createServerFn({ method: "POST" })
  .validator(zodValidator(uploadPhotoSchema))
  .handler(async ({ data }) => {
    const { supabase, user } = await requireAdmin();

    const categoryError = await validatePhotoCategory(data.category);
    if (categoryError) {
      return { error: categoryError, photo: null };
    }

    const folderResult = await resolveFolderId(supabase, data.folderId);
    if (folderResult !== null && typeof folderResult === "object") {
      return { error: folderResult.error, photo: null };
    }
    const resolvedFolderId = typeof folderResult === "string" ? folderResult : null;

    const title = data.title.trim();
    if (title.length < 1) {
      return { error: "Title is required.", photo: null };
    }

    const buffer = Buffer.from(data.fileBase64, "base64");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return { error: "File must be 15 MB or smaller.", photo: null };
    }

    const ext = extensionForMime(data.mimeType);
    const baseName = data.filename.replace(/\.[^.]+$/, "") || "photo";

    const cleanUpload = await uploadToFivemanage(buffer, {
      filename: `${baseName}.${ext}`,
      mimeType: data.mimeType,
      path: "gallery",
      metadata: { title },
    });

    let watermarkedCdnUrl: string | null = null;
    try {
      const { uploadWatermarkedToFivemanage } = await import("../watermark-image");
      watermarkedCdnUrl = await uploadWatermarkedToFivemanage(buffer, data.mimeType, {
        filename: `${baseName}-wm`,
        title,
      });
    } catch (watermarkError) {
      console.error("Watermark generation failed:", watermarkError);
    }

    const { data: photo, error } = await supabase
      .from("photos")
      .insert({
        title,
        category: data.category,
        fivemanage_id: cleanUpload.id,
        cdn_url: cleanUpload.url,
        original_url: cleanUpload.originalUrl ?? null,
        watermarked_cdn_url: watermarkedCdnUrl,
        uploaded_by: user.id,
        folder_id: resolvedFolderId,
      })
      .select(PHOTO_SELECT)
      .single();

    if (error) {
      await deleteFromFivemanage(cleanUpload.id).catch(() => undefined);
      return { error: error.message, photo: null };
    }

    const inserted = photo as DbPhoto;

    if (data.projectId) {
      const linkError = await linkPhotoToProject(supabase, data.projectId, inserted.id);
      if (linkError) {
        await supabase.from("photos").delete().eq("id", inserted.id);
        await deleteFromFivemanage(cleanUpload.id).catch(() => undefined);
        return { error: linkError, photo: null };
      }
    }

    return { error: null, photo: inserted };
  });

export const updatePhoto = createServerFn({ method: "POST" })
  .validator(zodValidator(updatePhotoSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.category !== undefined) {
      const categoryError = await validatePhotoCategory(data.category);
      if (categoryError) return { error: categoryError };
      patch.category = data.category.trim();
    }
    if (data.published !== undefined) patch.published = data.published;
    if (data.featured !== undefined) patch.featured = data.featured;
    if (data.public_watermarked !== undefined) patch.public_watermarked = data.public_watermarked;
    if (data.folder_id !== undefined) {
      const folderResult = await resolveFolderId(supabase, data.folder_id);
      if (folderResult !== null && typeof folderResult === "object") {
        return { error: folderResult.error };
      }
      patch.folder_id = typeof folderResult === "string" ? folderResult : null;
    }
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;

    const { error } = await supabase.from("photos").update(patch).eq("id", data.id);
    if (error) return { error: error.message };
    return { error: null };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .validator(zodValidator(idSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const { data: photo, error: fetchError } = await supabase
      .from("photos")
      .select("fivemanage_id")
      .eq("id", data.id)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (!photo) return { error: "Photo not found." };

    const { error } = await supabase.from("photos").delete().eq("id", data.id);
    if (error) return { error: error.message };

    await deleteFromFivemanage(photo.fivemanage_id).catch((err) => {
      console.error("Fivemanage delete failed:", err);
    });

    return { error: null };
  });

export const bulkUpdatePhotos = createServerFn({ method: "POST" })
  .validator(zodValidator(bulkUpdatePhotosSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    if (data.ids.length === 0) {
      return { error: "No photos selected.", updated: 0 };
    }
    if (data.ids.length > 200) {
      return { error: "Select 200 photos or fewer." };
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.category !== undefined) {
      const categoryError = await validatePhotoCategory(data.category);
      if (categoryError) return { error: categoryError, updated: 0 };
      patch.category = data.category.trim();
    }
    if (data.published !== undefined) patch.published = data.published;
    if (data.featured !== undefined) patch.featured = data.featured;
    if (data.public_watermarked !== undefined) patch.public_watermarked = data.public_watermarked;
    if (data.folder_id !== undefined) {
      const folderResult = await resolveFolderId(supabase, data.folder_id);
      if (folderResult !== null && typeof folderResult === "object") {
        return { error: folderResult.error, updated: 0 };
      }
      patch.folder_id = typeof folderResult === "string" ? folderResult : null;
    }

    if (Object.keys(patch).length === 1) {
      return { error: "No changes to apply.", updated: 0 };
    }

    const { error } = await supabase.from("photos").update(patch).in("id", data.ids);
    if (error) return { error: error.message, updated: 0 };
    return { error: null, updated: data.ids.length };
  });

export const bulkDeletePhotos = createServerFn({ method: "POST" })
  .validator(zodValidator(bulkDeletePhotosSchema))
  .handler(async ({ data }) => {
    await requireAdmin();

    if (data.ids.length === 0) {
      return { error: "No photos selected.", deleted: 0 };
    }
    if (data.ids.length > 200) {
      return { error: "Select 200 photos or fewer." };
    }

    const result = await deletePhotosWithAssets(getSupabaseServerClient(), data.ids);
    if (result.error) return { error: result.error, deleted: 0 };

    return { error: null, deleted: data.ids.length };
  });
