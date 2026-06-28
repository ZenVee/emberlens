import { useEffect } from "react";

import { applySiteTheme, pickSiteTheme } from "@/lib/site-theme";
import { useSiteSettings } from "@/lib/site-settings-queries";

export function SiteThemeProvider() {
  const settings = useSiteSettings();

  useEffect(() => {
    applySiteTheme(pickSiteTheme(settings));
  }, [settings]);

  return null;
}
