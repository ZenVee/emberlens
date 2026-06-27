import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { siteSettingsQueryKey } from "./query-keys";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "./site-settings-types";

async function fetchSiteSettingsQuery() {
  const { fetchSiteSettings } = await import("./site-settings");
  return fetchSiteSettings();
}

export const siteSettingsQueryOptions = {
  queryKey: siteSettingsQueryKey,
  queryFn: fetchSiteSettingsQuery,
};

export function useSiteSettings(): SiteSettings {
  const { settings } = useRouteContext({ from: "__root__" });
  const { data } = useQuery({
    ...siteSettingsQueryOptions,
    initialData: settings,
  });
  return data ?? DEFAULT_SITE_SETTINGS;
}

export function studioBrandParts(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return { lead: name, accent: "" };
  }
  return {
    lead: parts.slice(0, -1).join(" "),
    accent: parts[parts.length - 1] ?? "",
  };
}

export function linesFromMultiline(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
