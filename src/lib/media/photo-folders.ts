import { createServerFn } from "@tanstack/react-start";

import { requireAdmin } from "../admin";
import type { DbPhotoFolder } from "../media-types";
import { zodValidator } from "../schemas/parse";
import { createPhotoFolderSchema, idSchema, updatePhotoFolderSchema } from "../schemas/media";
import { getSupabaseServerClient } from "../supabase";
import { FOLDER_SELECT } from "./shared";

export const fetchAdminPhotoFolders = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbPhotoFolder[]> => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("photo_folders")
      .select(FOLDER_SELECT)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data as DbPhotoFolder[];
  },
);

export const createPhotoFolder = createServerFn({ method: "POST" })
  .validator(zodValidator(createPhotoFolderSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const name = data.name.trim();
    if (name.length < 1) return { error: "Folder name is required.", folder: null };

    const { data: maxRow } = await supabase
      .from("photo_folders")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: folder, error } = await supabase
      .from("photo_folders")
      .insert({ name, sort_order: (maxRow?.sort_order ?? -1) + 1 })
      .select(FOLDER_SELECT)
      .single();

    if (error) return { error: error.message, folder: null };
    return { error: null, folder: folder as DbPhotoFolder };
  });

export const updatePhotoFolder = createServerFn({ method: "POST" })
  .validator(zodValidator(updatePhotoFolderSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 1) return { error: "Folder name is required." };
      patch.name = name;
    }
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;

    const { error } = await supabase.from("photo_folders").update(patch).eq("id", data.id);
    if (error) return { error: error.message };
    return { error: null };
  });

export const deletePhotoFolder = createServerFn({ method: "POST" })
  .validator(zodValidator(idSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("photo_folders").delete().eq("id", data.id);
    if (error) return { error: error.message };
    return { error: null };
  });
