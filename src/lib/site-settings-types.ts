import {
  DEFAULT_PHOTO_CATEGORIES,
  DEFAULT_PROJECT_CATEGORIES,
  DEFAULT_SESSION_TYPES,
} from "./categories";

export type SiteService = {
  title: string;
  description: string;
  price: string;
};

export const DEFAULT_SERVICES: SiteService[] = [
  {
    title: "Portraits",
    description: "Editorial-quality portrait sessions, in studio or on location.",
    price: "from $250",
  },
  {
    title: "Automotive",
    description: "Custom builds, garage features, and rolling shots after dark.",
    price: "from $400",
  },
  {
    title: "Events",
    description: "Clubs, openings, after-parties — captured cinematic and discreet.",
    price: "from $600",
  },
  {
    title: "Lifestyle & Travel",
    description: "Editorial photo essays for brands, magazines, and personal stories.",
    price: "Custom",
  },
];

export type SiteSettings = {
  studio_name: string;
  tagline: string;
  location: string;
  bio: string;
  hero_image_url: string | null;
  hero_image_fivemanage_id: string | null;
  hero_title: string;
  hero_text: string;
  footer_tagline: string;
  footer_studio_heading: string;
  footer_studio_body: string;
  footer_contact_heading: string;
  footer_contact_body: string;
  footer_copyright: string;
  gallery_eyebrow: string;
  gallery_title: string;
  gallery_description: string;
  gallery_show_categories: boolean;
  projects_eyebrow: string;
  projects_title: string;
  projects_description: string;
  services_eyebrow: string;
  services_title: string;
  services: SiteService[];
  photo_categories: string[];
  project_categories: string[];
  session_types: string[];
  theme_primary_color: string;
  theme_secondary_color: string;
  theme_accent_color: string;
  theme_ember_color: string;
  theme_font_sans: string;
  theme_font_display: string;
  theme_border_radius: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  studio_name: "Ember Lens",
  tagline: "Capturing Los Santos, one frame at a time.",
  location: "Vinewood Blvd, Los Santos",
  bio: "A one-person cinematic photography studio operating after dark across Los Santos and Blaine County.",
  hero_image_url: null,
  hero_image_fivemanage_id: null,
  hero_title: "Ember Lens",
  hero_text:
    "Ember Lens is a cinematic photography studio for the streets, skies, and people of Los Santos. Cozy, warm, and a little bit nocturnal.",
  footer_tagline: "Capturing Los Santos, one frame at a time.",
  footer_studio_heading: "Studio",
  footer_studio_body: "Vinewood Blvd, Los Santos\nOpen by appointment",
  footer_contact_heading: "Contact",
  footer_contact_body: "@emberlens / RP-only studio",
  footer_copyright:
    "© 2026 Ember Lens — A fictional studio for GTA V roleplay. Not affiliated with Rockstar Games.",
  gallery_eyebrow: "Gallery",
  gallery_title: "The full archive",
  gallery_description:
    "Click any frame to view it full-screen. Filtered by category, refreshed monthly.",
  gallery_show_categories: true,
  projects_eyebrow: "Projects",
  projects_title: "Selected work",
  projects_description:
    "A curated set of recent projects across portraits, automotive, events, and editorial.",
  services_eyebrow: "Services",
  services_title: "What we shoot",
  services: DEFAULT_SERVICES,
  photo_categories: [...DEFAULT_PHOTO_CATEGORIES],
  project_categories: [...DEFAULT_PROJECT_CATEGORIES],
  session_types: [...DEFAULT_SESSION_TYPES],
  theme_primary_color: "#e5a050",
  theme_secondary_color: "#4a423c",
  theme_accent_color: "#e8b49a",
  theme_ember_color: "#d99548",
  theme_font_sans: "Inter",
  theme_font_display: "Fraunces",
  theme_border_radius: "1rem",
};

export type SiteSettingsPatch = Partial<
  Omit<SiteSettings, "hero_image_url" | "hero_image_fivemanage_id">
> & {
  hero_image_url?: string | null;
  hero_image_fivemanage_id?: string | null;
};

export type SiteSettingsForm = Omit<SiteSettings, "hero_image_url" | "hero_image_fivemanage_id">;

export function toSiteSettingsForm(settings: SiteSettings): SiteSettingsForm {
  const { hero_image_url: _url, hero_image_fivemanage_id: _id, ...form } = settings;
  return form;
}
