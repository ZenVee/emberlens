import { createServerFn } from "@tanstack/react-start";

import { requireAdmin } from "../admin";
import type { AdminProjectPhotoGroup, DbPhoto } from "../media-types";
import { getSupabaseServerClient } from "../supabase";
import { PHOTO_SELECT } from "./shared";

export const fetchAdminPhotos = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbPhoto[]> => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("photos")
      .select(PHOTO_SELECT)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as DbPhoto[];
  },
);

export const fetchAdminProjectPhotoGroups = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminProjectPhotoGroup[]> => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, project_photos(photo_id)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? [])
      .map((row) => ({
        projectId: row.id as string,
        title: row.title as string,
        photoIds: ((row.project_photos as { photo_id: string }[]) ?? []).map(
          (link) => link.photo_id,
        ),
      }))
      .filter((group) => group.photoIds.length > 0);
  },
);
