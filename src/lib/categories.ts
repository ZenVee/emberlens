export const DEFAULT_PHOTO_CATEGORIES = [
  "Portrait",
  "Automotive",
  "Event",
  "Street",
  "Lifestyle",
  "Cityscape",
] as const;

export const DEFAULT_PROJECT_CATEGORIES = [...DEFAULT_PHOTO_CATEGORIES];

export const DEFAULT_SESSION_TYPES = [
  "Portrait session",
  "Automotive shoot",
  "Event coverage",
  "Lifestyle / Travel",
] as const;

export type PhotoCategory = string;

export function normalizeCategoryList(value: unknown, fallback: readonly string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    items.push(trimmed);
  }
  return items.length > 0 ? items : [...fallback];
}

export function isAllowedCategory(value: string, allowed: readonly string[]): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && allowed.includes(trimmed);
}

export function categorySelectOptions(categories: readonly string[], current?: string | null) {
  const values = new Set(categories);
  if (current?.trim()) values.add(current.trim());
  return [...values].map((value) => ({ value, label: value }));
}
