import { Link, useRouteContext, useRouter, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  LayoutDashboard,
  Images,
  FolderOpen,
  CalendarCheck,
  Settings,
  LogOut,
  Bell,
  ExternalLink,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { prefetchAdminRoute } from "@/lib/admin-queries";
import { signOut } from "@/lib/auth";
import { authUserQueryKey } from "@/lib/query-keys";

import { ThemeToggle } from "./theme-toggle";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/photos", label: "Photos", icon: Images },
  { to: "/admin/projects", label: "Projects", icon: FolderOpen },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const signOutFn = useServerFn(signOut);
  const { user } = useRouteContext({ from: "__root__" });

  const initials =
    user?.name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EL";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutFn();
      queryClient.setQueryData(authUserQueryKey, null);
      await queryClient.invalidateQueries({ queryKey: authUserQueryKey });
      await router.invalidate();
      await router.navigate({ to: "/" });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border/60 bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-ember">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-lg">
            Ember <span className="text-gradient-ember">Lens</span>
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((n) => {
            const active = n.to === "/admin" ? pathname === "/admin" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                preload="intent"
                onMouseEnter={() => prefetchAdminRoute(queryClient, n.to)}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-gradient-ember text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-3 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" /> {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="grid h-9 w-9 place-items-center rounded-full border border-border md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle sidebar"
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
              <div>
                <h1 className="font-display text-xl leading-tight">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-secondary">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-ember" />
              </button>
              <ThemeToggle />
              <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-2 py-1 pr-3 sm:flex">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-ember text-xs font-semibold text-primary-foreground">
                    {initials}
                  </span>
                )}
                <span className="max-w-[10rem] truncate text-sm">{user?.name ?? "Studio"}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-6 md:px-8">{children}</main>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
