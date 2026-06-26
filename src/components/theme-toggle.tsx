import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`relative inline-flex h-9 w-16 items-center rounded-full border border-border bg-muted transition-colors hover:bg-accent/30 ${className}`}
    >
      <span
        className={`absolute top-1 left-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-ember text-primary-foreground shadow-glow transition-transform duration-300 ${
          isDark ? "translate-x-0" : "translate-x-7"
        }`}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </button>
  );
}
