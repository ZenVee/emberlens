import { createServerFn } from "@tanstack/react-start";

import { requireAdmin } from "../admin";
import { slugify, type DbPhoto, type DbProject } from "../media-types";
import { syncProjectPaidToBookings } from "../paid-sync";
import { zodValidator } from "../schemas/parse";
import {
  createProjectServerSchema,
  idSchema,
  projectIdSchema,
  setProjectPhotosSchema,
  updateProjectSchema,
} from "../schemas/media";
import { getSupabaseServerClient } from "../supabase";
import { deletePhotosWithAssets } from "./photo-assets";
import { PHOTO_SELECT, PROJECT_SELECT, validateProjectCategory } from "./shared";

export const fetchAdminProjects = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `${PROJECT_SELECT}, cover:photos!projects_cover_photo_id_fkey(cdn_url), project_photos(count)`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    data as (DbProject & {
      cover: { cdn_url: string } | null;
      project_photos: { count: number }[];
    })[]
  ).map((project) => ({
    ...project,
    photoCount: project.project_photos[0]?.count ?? 0,
    coverUrl: project.cover?.cdn_url ?? null,
  }));
});

export const fetchAdminProject = createServerFn({ method: "GET" })
  .validator(zodValidator(projectIdSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw error;
    if (!project) return null;

    const { data: links, error: linksError } = await supabase
      .from("project_photos")
      .select(`sort_order, photo_id, photo:photos(${PHOTO_SELECT})`)
      .eq("project_id", data.id)
      .order("sort_order", { ascending: true });

    if (linksError) throw linksError;

    return {
      project: project as DbProject,
      assignedPhotos: (links as { sort_order: number; photo_id: string; photo: DbPhoto | null }[])
        .filter(
          (link): link is { sort_order: number; photo_id: string; photo: DbPhoto } =>
            link.photo !== null,
        )
        .map((link) => ({
          sort_order: link.sort_order,
          photo: link.photo,
        })),
    };
  });

export const createProject = createServerFn({ method: "POST" })
  .validator(zodValidator(createProjectServerSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const title = data.title.trim();
    if (title.length < 1) return { error: "Title is required.", project: null };

    let projectCategory: string | null = null;
    if (data.category) {
      const categoryError = await validateProjectCategory(data.category);
      if (categoryError) return { error: categoryError, project: null };
      projectCategory = data.category.trim();
    }

    let slug = slugify(title) || "project";
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        title,
        slug,
        client: data.client?.trim() || null,
        description: data.description?.trim() || null,
        category: projectCategory,
        shoot_date: data.shoot_date || null,
      })
      .select(PROJECT_SELECT)
      .single();

    if (error) return { error: error.message, project: null };
    return { error: null, project: project as DbProject };
  });

export const updateProject = createServerFn({ method: "POST" })
  .validator(zodValidator(updateProjectSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title?.trim() ?? "";
    if (data.client !== undefined) patch.client = data.client?.trim() || null;
    if (data.description !== undefined) patch.description = data.description?.trim() || null;
    if (data.download_link !== undefined) patch.download_link = data.download_link?.trim() || null;
    if (data.category !== undefined) {
      if (data.category === null) {
        patch.category = null;
      } else {
        const categoryError = await validateProjectCategory(data.category);
        if (categoryError) return { error: categoryError };
        patch.category = data.category.trim();
      }
    }
    if (data.shoot_date !== undefined) patch.shoot_date = data.shoot_date;
    if (data.cover_photo_id !== undefined) patch.cover_photo_id = data.cover_photo_id;
    if (data.published !== undefined) patch.published = data.published;
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;
    if (data.client_paid !== undefined) {
      const clientPaidAt = data.client_paid ? new Date().toISOString() : null;
      patch.client_paid_at = clientPaidAt;
      const syncResult = await syncProjectPaidToBookings(supabase, data.id, clientPaidAt);
      if (syncResult.error) return { error: syncResult.error };
    }
    if (data.public_watermarked !== undefined) patch.public_watermarked = data.public_watermarked;

    const { error } = await supabase.from("projects").update(patch).eq("id", data.id);
    if (error) return { error: error.message };
    return { error: null };
  });

export const setProjectPhotos = createServerFn({ method: "POST" })
  .validator(zodValidator(setProjectPhotosSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const { error: deleteError } = await supabase
      .from("project_photos")
      .delete()
      .eq("project_id", data.projectId);
    if (deleteError) return { error: deleteError.message };

    if (data.photoIds.length === 0) return { error: null };

    const rows = data.photoIds.map((photoId, index) => ({
      project_id: data.projectId,
      photo_id: photoId,
      sort_order: index,
    }));

    const { error } = await supabase.from("project_photos").insert(rows);
    if (error) return { error: error.message };
    return { error: null };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .validator(zodValidator(idSchema))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const { data: links, error: linksError } = await supabase
      .from("project_photos")
      .select("photo_id")
      .eq("project_id", data.id);

    if (linksError) return { error: linksError.message };

    const photoIds = [...new Set((links ?? []).map((row) => row.photo_id as string))];
    const deletePhotosResult = await deletePhotosWithAssets(supabase, photoIds);
    if (deletePhotosResult.error) return deletePhotosResult;

    const { error } = await supabase.from("projects").delete().eq("id", data.id);
    if (error) return { error: error.message };
    return { error: null };
  });
