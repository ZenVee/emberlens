import { isAllowedCategory } from "../categories";
import { loadSiteSettings } from "../site-settings-data";
import type { getSupabaseServerClient } from "../supabase";

export const PHOTO_SELECT =
  "id, title, category, fivemanage_id, cdn_url, watermarked_cdn_url, original_url, alt_text, sort_order, featured, published, public_watermarked, gallery_orientation, folder_id, created_at, updated_at";

export const FOLDER_SELECT = "id, name, sort_order, created_at, updated_at";

export const PROJECT_SELECT =
  "id, slug, title, client, shoot_date, category, description, download_link, cover_photo_id, published, client_paid_at, public_watermarked, sort_order, created_at, updated_at";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function decodeBase64Upload(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export type SupabaseClient = ReturnType<typeof getSupabaseServerClient>;

export async function validatePhotoCategory(category: string): Promise<string | null> {
  const settings = await loadSiteSettings();
  if (!isAllowedCategory(category, settings.photo_categories)) {
    return "Invalid category.";
  }
  return null;
}

export async function validateProjectCategory(category: string | null): Promise<string | null> {
  if (category === null) return null;
  const settings = await loadSiteSettings();
  if (!isAllowedCategory(category, settings.project_categories)) {
    return "Invalid category.";
  }
  return null;
}

export function extensionForMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

export async function resolveFolderId(
  supabase: SupabaseClient,
  folderId: string | null | undefined,
): Promise<string | null | { error: string }> {
  const id = folderId?.trim();
  if (!id) return null;

  const { data, error } = await supabase
    .from("photo_folders")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Folder not found." };
  return id;
}
