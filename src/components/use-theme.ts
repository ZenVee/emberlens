import { useContext } from "react";

import { ThemeContext, type Theme } from "./theme-context";

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "dark" as Theme, toggle: () => {} };
  return ctx;
}
