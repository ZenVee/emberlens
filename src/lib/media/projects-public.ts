import { createServerFn } from "@tanstack/react-start";

import {
  formatShootDate,
  photoUrlForProject,
  projectPageWatermarked,
  type DbPhoto,
  type DbProject,
  type PublicPhoto,
  type PublicProjectDetail,
  type PublicProjectListItem,
} from "../media-types";
import { shuffleArray } from "../gallery-orientation";
import { zodValidator } from "../schemas/parse";
import { slugSchema } from "../schemas/media";
import { getSupabaseServerClient } from "../supabase";
import { PHOTO_SELECT, PROJECT_SELECT } from "./shared";

export const fetchPublishedProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicProjectListItem[]> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        `${PROJECT_SELECT}, cover:photos!projects_cover_photo_id_fkey(cdn_url, watermarked_cdn_url)`,
      )
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
      cover:
        project.cover_photo_id && project.cover
          ? photoUrlForProject(
              {
                id: project.cover_photo_id,
                cdn_url: project.cover.cdn_url,
                watermarked_cdn_url: project.cover.watermarked_cdn_url,
              },
              project,
            )
          : "",
      clientPaid: Boolean(project.client_paid_at),
      publicWatermarked: project.public_watermarked,
    }));
  },
);

export const fetchProjectBySlug = createServerFn({ method: "GET" })
  .validator(zodValidator(slugSchema))
  .handler(async ({ data }): Promise<PublicProjectDetail | null> => {
    const supabase = getSupabaseServerClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `${PROJECT_SELECT}, cover:photos!projects_cover_photo_id_fkey(cdn_url, watermarked_cdn_url)`,
      )
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

    const images: PublicPhoto[] = shuffleArray(
      (links as { sort_order: number; photo: DbPhoto | null }[])
        .map((link) => link.photo)
        .filter((photo): photo is DbPhoto => photo !== null)
        .map((photo) => ({
          id: photo.id,
          title: photo.title,
          category: photo.category,
          src: photoUrlForProject(photo, typedProject),
          alt_text: photo.alt_text,
          watermarked: showWatermarks,
          gallery_orientation: photo.gallery_orientation ?? "portrait",
        })),
    );

    const coverSrc = typedProject.cover
      ? photoUrlForProject(
          {
            cdn_url: typedProject.cover.cdn_url,
            watermarked_cdn_url: typedProject.cover.watermarked_cdn_url,
          },
          typedProject,
        )
      : (images[0]?.src ?? "");

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
