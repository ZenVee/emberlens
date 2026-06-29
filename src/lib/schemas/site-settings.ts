import { z } from "zod";

const siteServiceSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.string(),
});

export const siteSettingsPatchSchema = z
  .object({
    studio_name: z.string().optional(),
    tagline: z.string().optional(),
    location: z.string().optional(),
    bio: z.string().optional(),
    hero_title: z.string().optional(),
    hero_text: z.string().optional(),
    footer_tagline: z.string().optional(),
    footer_studio_heading: z.string().optional(),
    footer_studio_body: z.string().optional(),
    footer_contact_heading: z.string().optional(),
    footer_contact_body: z.string().optional(),
    footer_copyright: z.string().optional(),
    gallery_eyebrow: z.string().optional(),
    gallery_title: z.string().optional(),
    gallery_description: z.string().optional(),
    gallery_show_categories: z.boolean().optional(),
    projects_eyebrow: z.string().optional(),
    projects_title: z.string().optional(),
    projects_description: z.string().optional(),
    services_eyebrow: z.string().optional(),
    services_title: z.string().optional(),
    services: z.array(siteServiceSchema).optional(),
    photo_categories: z.array(z.string()).optional(),
    project_categories: z.array(z.string()).optional(),
    session_types: z.array(z.string()).optional(),
    hero_image_url: z.string().nullable().optional(),
    hero_image_fivemanage_id: z.string().nullable().optional(),
    theme_primary_color: z.string().optional(),
    theme_secondary_color: z.string().optional(),
    theme_accent_color: z.string().optional(),
    theme_ember_color: z.string().optional(),
    theme_font_sans: z.string().optional(),
    theme_font_display: z.string().optional(),
    theme_border_radius: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one setting must be provided.",
  });

export const uploadHeroImageSchema = z.object({
  fileBase64: z.string().min(1),
  mimeType: z.string().min(1),
  filename: z.string().min(1),
});
