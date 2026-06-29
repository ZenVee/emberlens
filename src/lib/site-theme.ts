import type { SiteSettings } from "./site-settings-types";

export type SiteThemeSettings = Pick<
  SiteSettings,
  | "theme_primary_color"
  | "theme_secondary_color"
  | "theme_accent_color"
  | "theme_ember_color"
  | "theme_font_sans"
  | "theme_font_display"
  | "theme_border_radius"
>;

export const THEME_FONT_SANS_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Outfit", label: "Outfit" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
  { value: "Manrope", label: "Manrope" },
  { value: "Source Sans 3", label: "Source Sans 3" },
] as const;

export const THEME_FONT_DISPLAY_OPTIONS = [
  { value: "Fraunces", label: "Fraunces" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Lora", label: "Lora" },
  { value: "Libre Baskerville", label: "Libre Baskerville" },
  { value: "DM Serif Display", label: "DM Serif Display" },
] as const;

export const THEME_BORDER_RADIUS_OPTIONS = [
  { value: "0.5rem", label: "Sharp" },
  { value: "1rem", label: "Default" },
  { value: "1.5rem", label: "Soft" },
  { value: "2rem", label: "Round" },
] as const;

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!HEX_COLOR.test(trimmed)) return fallback;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export function normalizeThemeFont(
  value: string,
  options: readonly { value: string }[],
  fallback: string,
): string {
  const trimmed = value.trim();
  return options.some((option) => option.value === trimmed) ? trimmed : fallback;
}

export function normalizeBorderRadius(value: string, fallback: string): string {
  const trimmed = value.trim();
  return THEME_BORDER_RADIUS_OPTIONS.some((option) => option.value === trimmed)
    ? trimmed
    : fallback;
}

export function fontStack(name: string, kind: "sans" | "display"): string {
  const fallback =
    kind === "sans" ? "ui-sans-serif, system-ui, sans-serif" : "ui-serif, Georgia, serif";
  return `"${name}", ${fallback}`;
}

export function buildGoogleFontsUrl(fontSans: string, fontDisplay: string): string {
  const families = [fontSans, fontDisplay]
    .filter((name, index, list) => list.indexOf(name) === index)
    .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export function applySiteTheme(theme: SiteThemeSettings): void {
  if (typeof document === "undefined") return;

  const primary = normalizeHexColor(theme.theme_primary_color, "#e5a050");
  const secondary = normalizeHexColor(theme.theme_secondary_color, "#4a423c");
  const accent = normalizeHexColor(theme.theme_accent_color, "#e8b49a");
  const ember = normalizeHexColor(theme.theme_ember_color, "#d99548");
  const fontSans = normalizeThemeFont(theme.theme_font_sans, THEME_FONT_SANS_OPTIONS, "Inter");
  const fontDisplay = normalizeThemeFont(
    theme.theme_font_display,
    THEME_FONT_DISPLAY_OPTIONS,
    "Fraunces",
  );
  const radius = normalizeBorderRadius(theme.theme_border_radius, "1rem");

  const root = document.documentElement;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--secondary", secondary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--ember", ember);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--radius", radius);
  root.style.setProperty("--site-font-sans", fontStack(fontSans, "sans"));
  root.style.setProperty("--site-font-display", fontStack(fontDisplay, "display"));
  root.style.setProperty("--gradient-ember", `linear-gradient(135deg, ${primary}, ${accent})`);
  root.style.setProperty(
    "--shadow-glow",
    `0 0 40px color-mix(in srgb, ${primary} 25%, transparent)`,
  );

  let link = document.getElementById("site-theme-fonts") as HTMLLinkElement | null;
  const href = buildGoogleFontsUrl(fontSans, fontDisplay);
  if (!link) {
    link = document.createElement("link");
    link.id = "site-theme-fonts";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== href) {
    link.href = href;
  }
}

export function pickSiteTheme(settings: SiteSettings): SiteThemeSettings {
  return {
    theme_primary_color: settings.theme_primary_color,
    theme_secondary_color: settings.theme_secondary_color,
    theme_accent_color: settings.theme_accent_color,
    theme_ember_color: settings.theme_ember_color,
    theme_font_sans: settings.theme_font_sans,
    theme_font_display: settings.theme_font_display,
    theme_border_radius: settings.theme_border_radius,
  };
}
