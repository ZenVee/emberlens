export const PHOTO_CATEGORIES = [
  "Portrait",
  "Automotive",
  "Event",
  "Street",
  "Lifestyle",
  "Cityscape",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

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
  clientPaid: boolean;
  published: boolean;
  images: PublicPhoto[];
};

export function photoUrlForProject(
  photo: Pick<DbPhoto, "cdn_url" | "watermarked_cdn_url">,
  project: Pick<DbProject, "client_paid_at">,
): string {
  void photo.watermarked_cdn_url;
  return photo.cdn_url;
}

export function toPublicPhoto(photo: DbPhoto): PublicPhoto {
  return {
    id: photo.id,
    title: photo.title,
    category: photo.category,
    src: photo.cdn_url,
    alt_text: photo.alt_text,
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
