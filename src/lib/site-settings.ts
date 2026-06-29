import { createServerFn } from "@tanstack/react-start";

import { deleteFromFivemanage, uploadToFivemanage } from "./fivemanage";
import {
  normalizeCategoryList,
  DEFAULT_PHOTO_CATEGORIES,
  DEFAULT_PROJECT_CATEGORIES,
  DEFAULT_SESSION_TYPES,
} from "./categories";
import { loadSiteSettings, SITE_SETTINGS_SELECT } from "./site-settings-data";
import { getSupabaseServerClient } from "./supabase";
import {
  normalizeBorderRadius,
  normalizeHexColor,
  normalizeThemeFont,
  THEME_FONT_DISPLAY_OPTIONS,
  THEME_FONT_SANS_OPTIONS,
} from "./site-theme";
import type { SiteSettings } from "./site-settings-types";
import { zodValidator } from "./schemas/parse";
import { siteSettingsPatchSchema, uploadHeroImageSchema } from "./schemas/site-settings";

const MAX_HERO_BYTES = 15 * 1024 * 1024;

function extensionForMime(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

export const fetchSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    return loadSiteSettings();
  },
);

export const fetchAdminSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    const { requireAdmin } = await import("./admin");
    await requireAdmin();
    return loadSiteSettings();
  },
);

export const updateSiteSettings = createServerFn({ method: "POST" })
  .validator(zodValidator(siteSettingsPatchSchema))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin");
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (data.studio_name !== undefined) patch.studio_name = data.studio_name.trim();
    if (data.tagline !== undefined) patch.tagline = data.tagline.trim();
    if (data.location !== undefined) patch.location = data.location.trim();
    if (data.bio !== undefined) patch.bio = data.bio.trim();
    if (data.hero_title !== undefined) patch.hero_title = data.hero_title.trim();
    if (data.hero_text !== undefined) patch.hero_text = data.hero_text.trim();
    if (data.footer_tagline !== undefined) patch.footer_tagline = data.footer_tagline.trim();
    if (data.footer_studio_heading !== undefined)
      patch.footer_studio_heading = data.footer_studio_heading.trim();
    if (data.footer_studio_body !== undefined)
      patch.footer_studio_body = data.footer_studio_body.trim();
    if (data.footer_contact_heading !== undefined)
      patch.footer_contact_heading = data.footer_contact_heading.trim();
    if (data.footer_contact_body !== undefined)
      patch.footer_contact_body = data.footer_contact_body.trim();
    if (data.footer_copyright !== undefined) patch.footer_copyright = data.footer_copyright.trim();
    if (data.gallery_eyebrow !== undefined) patch.gallery_eyebrow = data.gallery_eyebrow.trim();
    if (data.gallery_title !== undefined) patch.gallery_title = data.gallery_title.trim();
    if (data.gallery_description !== undefined)
      patch.gallery_description = data.gallery_description.trim();
    if (data.gallery_show_categories !== undefined)
      patch.gallery_show_categories = data.gallery_show_categories;
    if (data.projects_eyebrow !== undefined) patch.projects_eyebrow = data.projects_eyebrow.trim();
    if (data.projects_title !== undefined) patch.projects_title = data.projects_title.trim();
    if (data.projects_description !== undefined)
      patch.projects_description = data.projects_description.trim();
    if (data.services_eyebrow !== undefined) patch.services_eyebrow = data.services_eyebrow.trim();
    if (data.services_title !== undefined) patch.services_title = data.services_title.trim();
    if (data.services !== undefined) {
      patch.services = data.services
        .map((service) => ({
          title: service.title.trim(),
          description: service.description.trim(),
          price: service.price.trim(),
        }))
        .filter((service) => service.title.length > 0);
    }
    if (data.photo_categories !== undefined) {
      patch.photo_categories = normalizeCategoryList(
        data.photo_categories,
        DEFAULT_PHOTO_CATEGORIES,
      );
    }
    if (data.project_categories !== undefined) {
      patch.project_categories = normalizeCategoryList(
        data.project_categories,
        DEFAULT_PROJECT_CATEGORIES,
      );
    }
    if (data.session_types !== undefined) {
      patch.session_types = normalizeCategoryList(data.session_types, DEFAULT_SESSION_TYPES);
    }
    if (data.hero_image_url !== undefined) patch.hero_image_url = data.hero_image_url;
    if (data.hero_image_fivemanage_id !== undefined)
      patch.hero_image_fivemanage_id = data.hero_image_fivemanage_id;
    if (data.theme_primary_color !== undefined) {
      patch.theme_primary_color = normalizeHexColor(data.theme_primary_color, "#e5a050");
    }
    if (data.theme_secondary_color !== undefined) {
      patch.theme_secondary_color = normalizeHexColor(data.theme_secondary_color, "#4a423c");
    }
    if (data.theme_accent_color !== undefined) {
      patch.theme_accent_color = normalizeHexColor(data.theme_accent_color, "#e8b49a");
    }
    if (data.theme_ember_color !== undefined) {
      patch.theme_ember_color = normalizeHexColor(data.theme_ember_color, "#d99548");
    }
    if (data.theme_font_sans !== undefined) {
      patch.theme_font_sans = normalizeThemeFont(
        data.theme_font_sans,
        THEME_FONT_SANS_OPTIONS,
        "Inter",
      );
    }
    if (data.theme_font_display !== undefined) {
      patch.theme_font_display = normalizeThemeFont(
        data.theme_font_display,
        THEME_FONT_DISPLAY_OPTIONS,
        "Fraunces",
      );
    }
    if (data.theme_border_radius !== undefined) {
      patch.theme_border_radius = normalizeBorderRadius(data.theme_border_radius, "1rem");
    }

    const { error } = await supabase
      .from("site_settings")
      .update(patch)
      .eq("id", 1)
      .select(SITE_SETTINGS_SELECT)
      .single();

    if (error) return { error: error.message, settings: null };
    return { error: null, settings: await loadSiteSettings() };
  });

export const uploadHeroImage = createServerFn({ method: "POST" })
  .validator(zodValidator(uploadHeroImageSchema))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin");
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    const buffer = Buffer.from(data.fileBase64, "base64");
    if (buffer.byteLength > MAX_HERO_BYTES) {
      return { error: "Image must be 15 MB or smaller.", settings: null };
    }

    const { data: existing } = await supabase
      .from("site_settings")
      .select("hero_image_fivemanage_id")
      .eq("id", 1)
      .maybeSingle();

    const ext = extensionForMime(data.mimeType);
    const baseName = data.filename.replace(/\.[^.]+$/, "") || "hero";

    const upload = await uploadToFivemanage(buffer, {
      filename: `${baseName}.${ext}`,
      mimeType: data.mimeType,
      path: "site",
      metadata: { type: "hero" },
    });

    const { error } = await supabase
      .from("site_settings")
      .update({
        hero_image_url: upload.url,
        hero_image_fivemanage_id: upload.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select(SITE_SETTINGS_SELECT)
      .single();

    if (error) {
      await deleteFromFivemanage(upload.id).catch(() => undefined);
      return { error: error.message, settings: null };
    }

    if (existing?.hero_image_fivemanage_id && existing.hero_image_fivemanage_id !== upload.id) {
      await deleteFromFivemanage(existing.hero_image_fivemanage_id).catch(() => undefined);
    }

    return { error: null, settings: await loadSiteSettings() };
  });

export const removeHeroImage = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin } = await import("./admin");
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("hero_image_fivemanage_id")
    .eq("id", 1)
    .maybeSingle();

  const { error } = await supabase
    .from("site_settings")
    .update({
      hero_image_url: null,
      hero_image_fivemanage_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select(SITE_SETTINGS_SELECT)
    .single();

  if (error) return { error: error.message, settings: null };

  if (existing?.hero_image_fivemanage_id) {
    await deleteFromFivemanage(existing.hero_image_fivemanage_id).catch(() => undefined);
  }

  return { error: null, settings: await loadSiteSettings() };
});
