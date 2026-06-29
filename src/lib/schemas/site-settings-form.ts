import { z } from "zod";

const siteServiceFormSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.string(),
});

export const siteSettingsFormSchema = z.object({
  studio_name: z.string(),
  tagline: z.string(),
  location: z.string(),
  bio: z.string(),
  hero_title: z.string(),
  hero_text: z.string(),
  footer_tagline: z.string(),
  footer_studio_heading: z.string(),
  footer_studio_body: z.string(),
  footer_contact_heading: z.string(),
  footer_contact_body: z.string(),
  footer_copyright: z.string(),
  gallery_eyebrow: z.string(),
  gallery_title: z.string(),
  gallery_description: z.string(),
  gallery_show_categories: z.boolean(),
  projects_eyebrow: z.string(),
  projects_title: z.string(),
  projects_description: z.string(),
  services_eyebrow: z.string(),
  services_title: z.string(),
  services: z.array(siteServiceFormSchema),
  photo_categories: z.array(z.string()),
  project_categories: z.array(z.string()),
  session_types: z.array(z.string()),
  theme_primary_color: z.string(),
  theme_secondary_color: z.string(),
  theme_accent_color: z.string(),
  theme_ember_color: z.string(),
  theme_font_sans: z.string(),
  theme_font_display: z.string(),
  theme_border_radius: z.string(),
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsFormSchema>;
