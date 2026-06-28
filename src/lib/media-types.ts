import {
  DEFAULT_PHOTO_CATEGORIES,
  type PhotoCategory,
} from "./categories";

export type { PhotoCategory } from "./categories";
export { DEFAULT_PHOTO_CATEGORIES } from "./categories";

/** @deprecated Use settings.photo_categories or DEFAULT_PHOTO_CATEGORIES */
export const PHOTO_CATEGORIES = DEFAULT_PHOTO_CATEGORIES;

export type DbPhoto = {
  id: string;
  title: string;
  category: PhotoCategory;
  fivemanage_id: string;
  cdn_url: string;
  watermarked_cdn_url: string | null;
  original_url: string | null;
  alt_text: string | null;
  sort_order: number;
  featured: boolean;
  published: boolean;
  public_watermarked: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicPhoto = {
  id: string;
  title: string;
  category: PhotoCategory;
  src: string;
  alt_text: string | null;
  watermarked?: boolean;
};

export type DbProject = {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  shoot_date: string | null;
  category: PhotoCategory | null;
  description: string | null;
  download_link: string | null;
  cover_photo_id: string | null;
  published: boolean;
  client_paid_at: string | null;
  public_watermarked: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PublicProjectListItem = {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  date: string;
  category: PhotoCategory | null;
  description: string | null;
  cover: string;
  clientPaid: boolean;
  publicWatermarked: boolean;
};

export type PublicProjectDetail = PublicProjectListItem & {
  clientPaid: boolean;
  publicWatermarked: boolean;
  published: boolean;
  images: PublicPhoto[];
};

export function clientGalleryWatermarked(project: Pick<DbProject, "client_paid_at">): boolean {
  return !project.client_paid_at;
}

export function publicGalleryWatermarked(
  project: Pick<DbProject, "client_paid_at" | "public_watermarked">,
): boolean {
  if (!project.client_paid_at) return true;
  return project.public_watermarked;
}

export function projectPageWatermarked(
  project: Pick<DbProject, "client_paid_at" | "published" | "public_watermarked">,
): boolean {
  if (!project.published) return clientGalleryWatermarked(project);
  return publicGalleryWatermarked(project);
}

export function publicPhotoSrc(
  photo: Pick<DbPhoto, "cdn_url" | "watermarked_cdn_url">,
  watermarked: boolean,
): string {
  if (watermarked && photo.watermarked_cdn_url) return photo.watermarked_cdn_url;
  return photo.cdn_url;
}

export function photoUrlForProject(
  photo: Pick<DbPhoto, "cdn_url" | "watermarked_cdn_url">,
  project: Pick<DbProject, "client_paid_at" | "published" | "public_watermarked">,
): string {
  return publicPhotoSrc(photo, projectPageWatermarked(project));
}

export function toPublicPhoto(photo: DbPhoto): PublicPhoto {
  const watermarked = photo.public_watermarked;
  return {
    id: photo.id,
    title: photo.title,
    category: photo.category,
    src: publicPhotoSrc(photo, watermarked),
    alt_text: photo.alt_text,
    watermarked,
  };
}

export function formatShootDate(shootDate: string | null): string {
  if (!shootDate) return "";
  const date = new Date(`${shootDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
