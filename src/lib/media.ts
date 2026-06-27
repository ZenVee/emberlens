import { createServerFn } from "@tanstack/react-start";

import { requireAdmin } from "./admin";
import { deleteFromFivemanage, uploadToFivemanage } from "./fivemanage";
import {
  formatShootDate,
  PHOTO_CATEGORIES,
  photoUrlForProject,
  projectPageWatermarked,
  publicGalleryWatermarked,
  slugify,
  toPublicPhoto,
  type DbPhoto,
  type DbProject,
  type PhotoCategory,
  type PublicPhoto,
  type PublicProjectDetail,
  type PublicProjectListItem,
} from "./media-types";
import { getSupabaseServerClient } from "./supabase";

const PHOTO_SELECT =
  "id, title, category, fivemanage_id, cdn_url, watermarked_cdn_url, original_url, alt_text, sort_order, featured, published, created_at, updated_at";

const PROJECT_SELECT =
  "id, slug, title, client, shoot_date, category, description, cover_photo_id, published, client_paid_at, public_watermarked, sort_order, created_at, updated_at";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

function isPhotoCategory(value: string): value is PhotoCategory {
  return (PHOTO_CATEGORIES as readonly string[]).includes(value);
}

function extensionForMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

export const fetchPublishedPhotos = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPhoto[]> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select(PHOTO_SELECT)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DbPhoto[]).map(toPublicPhoto);
});

export const fetchFeaturedPhotos = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPhoto[]> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select(PHOTO_SELECT)
    .eq("published", true)
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw error;
  return (data as DbPhoto[]).map(toPublicPhoto);
});

export const fetchAdminPhotos = createServerFn({ method: "GET" }).handler(async (): Promise<DbPhoto[]> => {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select(PHOTO_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as DbPhoto[];
});

async function linkPhotoToProject(
  supabase: ReturnType<typeof getSupabaseServerClient>,
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

export const uploadPhoto = createServerFn({ method: "POST" })
  .validator(
    (data: {
      fileBase64: string;
      mimeType: string;
      filename: string;
      title: string;
      category: PhotoCategory;
      projectId?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { supabase, user } = await requireAdmin();

    if (!isPhotoCategory(data.category)) {
      return { error: "Invalid category.", photo: null };
    }

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
      path: "emberlens/gallery",
      metadata: { title },
    });

    const { data: photo, error } = await supabase
      .from("photos")
      .insert({
        title,
        category: data.category,
        fivemanage_id: cleanUpload.id,
        cdn_url: cleanUpload.url,
        original_url: cleanUpload.originalUrl ?? null,
        watermarked_cdn_url: cleanUpload.url,
        uploaded_by: user.id,
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
  .validator(
    (data: {
      id: string;
      title?: string;
      category?: PhotoCategory;
      published?: boolean;
      featured?: boolean;
      sort_order?: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.category !== undefined) {
      if (!isPhotoCategory(data.category)) return { error: "Invalid category." };
      patch.category = data.category;
    }
    if (data.published !== undefined) patch.published = data.published;
    if (data.featured !== undefined) patch.featured = data.featured;
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;

    const { error } = await supabase.from("photos").update(patch).eq("id", data.id);
    if (error) return { error: error.message };
    return { error: null };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
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

export const fetchPublishedProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicProjectListItem[]> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select(`${PROJECT_SELECT}, cover:photos!projects_cover_photo_id_fkey(cdn_url, watermarked_cdn_url)`)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (
      data as (DbProject & {
        cover: { cdn_url: string; watermarked_cdn_url: string | null } | null;
      })[]
    ).map((project) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      client: project.client,
      date: formatShootDate(project.shoot_date),
      category: project.category,
      description: project.description,
      cover: project.cover ? photoUrlForProject(project.cover, project) : "",
      clientPaid: Boolean(project.client_paid_at),
      publicWatermarked: project.public_watermarked,
    }));
  },
);

export const fetchProjectBySlug = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<PublicProjectDetail | null> => {
    const supabase = getSupabaseServerClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select(`${PROJECT_SELECT}, cover:photos!projects_cover_photo_id_fkey(cdn_url, watermarked_cdn_url)`)
      .eq("slug", data.slug)
      .maybeSingle();

    if (error) throw error;
    if (!project) return null;

    const typedProject = project as DbProject & {
      cover: { cdn_url: string; watermarked_cdn_url: string | null } | null;
    };

    const { data: links, error: linksError } = await supabase
      .from("project_photos")
      .select(`sort_order, photo:photos(${PHOTO_SELECT})`)
      .eq("project_id", typedProject.id)
      .order("sort_order", { ascending: true });

    if (linksError) throw linksError;

    const showWatermarks = projectPageWatermarked(typedProject);

    const images: PublicPhoto[] = (
      links as { sort_order: number; photo: DbPhoto | null }[]
    )
      .map((link) => link.photo)
      .filter((photo): photo is DbPhoto => photo !== null)
      .map((photo) => ({
        id: photo.id,
        title: photo.title,
        category: photo.category,
        src: photoUrlForProject(photo, typedProject),
        alt_text: photo.alt_text,
        watermarked: showWatermarks,
      }));

    const coverSrc = typedProject.cover
      ? photoUrlForProject(
          {
            cdn_url: typedProject.cover.cdn_url,
            watermarked_cdn_url: typedProject.cover.watermarked_cdn_url,
          },
          typedProject,
        )
      : images[0]?.src ?? "";

    return {
      id: typedProject.id,
      slug: typedProject.slug,
      title: typedProject.title,
      client: typedProject.client,
      date: formatShootDate(typedProject.shoot_date),
      category: typedProject.category,
      description: typedProject.description,
      cover: coverSrc,
      clientPaid: Boolean(typedProject.client_paid_at),
      publicWatermarked: typedProject.public_watermarked,
      published: typedProject.published,
      images,
    };
  });

export const fetchAdminProjects = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("projects")
    .select(`${PROJECT_SELECT}, cover:photos!projects_cover_photo_id_fkey(cdn_url), project_photos(count)`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as (DbProject & { cover: { cdn_url: string } | null; project_photos: { count: number }[] })[]).map(
    (project) => ({
      ...project,
      photoCount: project.project_photos[0]?.count ?? 0,
      coverUrl: project.cover?.cdn_url ?? null,
    }),
  );
});

export const fetchAdminProject = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
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
        .filter((link): link is { sort_order: number; photo_id: string; photo: DbPhoto } => link.photo !== null)
        .map((link) => ({
          sort_order: link.sort_order,
          photo: link.photo,
        })),
    };
  });

export const createProject = createServerFn({ method: "POST" })
  .validator(
    (data: {
      title: string;
      client?: string;
      description?: string;
      category?: PhotoCategory;
      shoot_date?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const title = data.title.trim();
    if (title.length < 1) return { error: "Title is required.", project: null };

    let slug = slugify(title) || "project";
    const { data: existing } = await supabase.from("projects").select("id").eq("slug", slug).maybeSingle();
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
        category: data.category && isPhotoCategory(data.category) ? data.category : null,
        shoot_date: data.shoot_date || null,
      })
      .select(PROJECT_SELECT)
      .single();

    if (error) return { error: error.message, project: null };
    return { error: null, project: project as DbProject };
  });

export const updateProject = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      title?: string;
      client?: string;
      description?: string;
      category?: PhotoCategory | null;
      shoot_date?: string | null;
      cover_photo_id?: string | null;
      published?: boolean;
      client_paid?: boolean;
      public_watermarked?: boolean;
      sort_order?: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.client !== undefined) patch.client = data.client.trim() || null;
    if (data.description !== undefined) patch.description = data.description.trim() || null;
    if (data.category !== undefined) {
      patch.category = data.category && isPhotoCategory(data.category) ? data.category : null;
    }
    if (data.shoot_date !== undefined) patch.shoot_date = data.shoot_date;
    if (data.cover_photo_id !== undefined) patch.cover_photo_id = data.cover_photo_id;
    if (data.published !== undefined) patch.published = data.published;
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;
    if (data.client_paid !== undefined) {
      patch.client_paid_at = data.client_paid ? new Date().toISOString() : null;
    }
    if (data.public_watermarked !== undefined) patch.public_watermarked = data.public_watermarked;

    const { error } = await supabase.from("projects").update(patch).eq("id", data.id);
    if (error) return { error: error.message };
    return { error: null };
  });

export const setProjectPhotos = createServerFn({ method: "POST" })
  .validator((data: { projectId: string; photoIds: string[] }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const { error: deleteError } = await supabase.from("project_photos").delete().eq("project_id", data.projectId);
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
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("projects").delete().eq("id", data.id);
    if (error) return { error: error.message };
    return { error: null };
  });
