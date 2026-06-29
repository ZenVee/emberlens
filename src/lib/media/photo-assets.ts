import { deleteFromFivemanage } from "../fivemanage";
import type { SupabaseClient } from "./shared";

export async function deletePhotosWithAssets(
  supabase: SupabaseClient,
  photoIds: string[],
): Promise<{ error: string | null }> {
  if (photoIds.length === 0) return { error: null };

  const { data: photos, error: fetchError } = await supabase
    .from("photos")
    .select("id, fivemanage_id")
    .in("id", photoIds);

  if (fetchError) return { error: fetchError.message };

  const { error } = await supabase.from("photos").delete().in("id", photoIds);
  if (error) return { error: error.message };

  await Promise.all(
    (photos ?? []).map((photo) =>
      deleteFromFivemanage(photo.fivemanage_id).catch((err) => {
        console.error("Fivemanage delete failed:", err);
      }),
    ),
  );

  return { error: null };
}

export async function linkPhotoToProject(
  supabase: SupabaseClient,
  projectId: string,
  photoId: string,
) {
  const { data: maxRow } = await supabase
    .from("project_photos")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: linkError } = await supabase.from("project_photos").insert({
    project_id: projectId,
    photo_id: photoId,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });
  if (linkError) return linkError.message;

  const { data: project } = await supabase
    .from("projects")
    .select("cover_photo_id")
    .eq("id", projectId)
    .maybeSingle();

  if (project && !project.cover_photo_id) {
    await supabase.from("projects").update({ cover_photo_id: photoId }).eq("id", projectId);
  }

  return null;
}
