import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, Menu, X } from "lucide-react";
import { useState } from "react";

import { linesFromMultiline, studioBrandParts, useSiteSettings } from "@/lib/site-settings-queries";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/projects", label: "Projects" },
  { to: "/admin/login", label: "Studio" },
];

export function SiteNav() {
  const settings = useSiteSettings();
  const { lead, accent } = studioBrandParts(settings.studio_name);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-ember shadow-glow">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-xl tracking-tight">
            {lead}
            {accent ? (
              <>
                {" "}
                <span className="text-gradient-ember">{accent}</span>
              </>
            ) : null}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/projects"
            className="hidden rounded-full bg-gradient-ember px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] sm:inline-flex"
          >
            Book a shoot
          </Link>
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-border md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background/95 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const settings = useSiteSettings();
  const { lead, accent } = studioBrandParts(settings.studio_name);
  const studioLines = linesFromMultiline(settings.footer_studio_body);
  const contactLines = linesFromMultiline(settings.footer_contact_body);

  return (
    <footer className="mt-24 border-t border-border/60 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-ember">
              <Camera className="h-3.5 w-3.5 text-primary-foreground" />
            </span>
            <span className="font-display text-lg">
              {lead}
              {accent ? (
                <>
                  {" "}
                  <span className="text-gradient-ember">{accent}</span>
                </>
              ) : null}
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{settings.footer_tagline}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">{settings.footer_studio_heading}</p>
          {studioLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">{settings.footer_contact_heading}</p>
          {contactLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        {settings.footer_copyright}
      </div>
    </footer>
  );
}
