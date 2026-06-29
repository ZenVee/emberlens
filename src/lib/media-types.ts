import { DEFAULT_PHOTO_CATEGORIES, type PhotoCategory } from "./categories";
import type { GalleryOrientation } from "./gallery-orientation";

export type { GalleryOrientation } from "./gallery-orientation";
export type { PhotoCategory } from "./categories";
export { DEFAULT_PHOTO_CATEGORIES } from "./categories";

/** @deprecated Use settings.photo_categories or DEFAULT_PHOTO_CATEGORIES */
export const PHOTO_CATEGORIES = DEFAULT_PHOTO_CATEGORIES;

export type DbPhotoFolder = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AdminProjectPhotoGroup = {
  projectId: string;
  title: string;
  photoIds: string[];
};

export type DbPhoto = {
  id: string;
  title: string;
  category: PhotoCategory;
  fivemanage_id: string;
  cdn_url: string;
  original_url: string | null;
  alt_text: string | null;
  sort_order: number;
  featured: boolean;
  published: boolean;
  gallery_orientation: GalleryOrientation;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicPhoto = {
  id: string;
  title: string;
  category: PhotoCategory;
  src: string;
  alt_text: string | null;
  gallery_orientation: GalleryOrientation;
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
};

export type PublicProjectDetail = PublicProjectListItem & {
  published: boolean;
  images: PublicPhoto[];
};

export function toPublicPhoto(photo: DbPhoto): PublicPhoto {
  return {
    id: photo.id,
    title: photo.title,
    category: photo.category,
    src: photo.cdn_url,
    alt_text: photo.alt_text,
    gallery_orientation: photo.gallery_orientation ?? "portrait",
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
