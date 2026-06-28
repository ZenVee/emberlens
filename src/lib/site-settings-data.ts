import { getSupabaseServerClient } from "./supabase";
import {
  DEFAULT_PHOTO_CATEGORIES,
  DEFAULT_PROJECT_CATEGORIES,
  DEFAULT_SESSION_TYPES,
  normalizeCategoryList,
} from "./categories";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "./site-settings-types";

export const SITE_SETTINGS_SELECT =
  "studio_name, tagline, location, bio, hero_image_url, hero_image_fivemanage_id, hero_title, hero_text, footer_tagline, footer_studio_heading, footer_studio_body, footer_contact_heading, footer_contact_body, footer_copyright, gallery_eyebrow, gallery_title, gallery_description, gallery_show_categories, projects_eyebrow, projects_title, projects_description, services_eyebrow, services_title, services, photo_categories, project_categories, session_types";

function normalizeServices(value: unknown): SiteSettings["services"] {
  if (!Array.isArray(value)) return DEFAULT_SITE_SETTINGS.services;
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      const description = typeof row.description === "string" ? row.description.trim() : "";
      const price = typeof row.price === "string" ? row.price.trim() : "";
      if (!title) return null;
      return { title, description, price };
    })
    .filter((item): item is SiteSettings["services"][number] => item !== null);
}

export async function loadSiteSettings(): Promise<SiteSettings> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select(SITE_SETTINGS_SELECT)
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_SITE_SETTINGS;

  const row = data as Omit<
    SiteSettings,
    "services" | "photo_categories" | "project_categories" | "session_types"
  > & {
    services: unknown;
    photo_categories: unknown;
    project_categories: unknown;
    session_types: unknown;
  };
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...row,
    services: normalizeServices(row.services),
    photo_categories: normalizeCategoryList(row.photo_categories, DEFAULT_PHOTO_CATEGORIES),
    project_categories: normalizeCategoryList(row.project_categories, DEFAULT_PROJECT_CATEGORIES),
    session_types: normalizeCategoryList(row.session_types, DEFAULT_SESSION_TYPES),
  };
}
