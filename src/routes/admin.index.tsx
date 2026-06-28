import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  FolderOpen,
  Images,
  Plus,
  Upload,
} from "lucide-react";
import { useMemo } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { StatusBadge } from "@/components/status-badge";
import { useAdminBookings, useAdminPhotos, useAdminProjects } from "@/lib/admin-queries";
import { formatBookingDateTime } from "@/lib/bookings-types";
import { formatShootDate } from "@/lib/media-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Ember Lens" }] }),
  component: Dashboard,
});

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { user } = useRouteContext({ from: "__root__" });
  const { data: photos = [], isPending: photosPending } = useAdminPhotos();
  const { data: projects = [], isPending: projectsPending } = useAdminProjects();
  const { data: bookings = [], isPending: bookingsPending } = useAdminBookings();

  const now = Date.now();

  const pendingBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "Pending")
        .sort((a, b) => new Date(a.shoot_at).getTime() - new Date(b.shoot_at).getTime()),
    [bookings],
  );

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "Confirmed" && new Date(b.shoot_at).getTime() >= now)
        .sort((a, b) => new Date(a.shoot_at).getTime() - new Date(b.shoot_at).getTime())
        .slice(0, 5),
    [bookings, now],
  );

  const recentProjects = useMemo(() => projects.slice(0, 4), [projects]);

  const publishedPhotos = photos.filter((p) => p.published).length;
  const publishedProjects = projects.filter((p) => p.published).length;
  const draftProjects = projects.length - publishedProjects;

  const loading = photosPending || projectsPending || bookingsPending;

  const subtitle = loading
    ? "Loading your studio overview…"
    : pendingBookings.length > 0
      ? `${pendingBookings.length} booking${pendingBookings.length === 1 ? "" : "s"} need your attention`
      : upcomingBookings.length > 0
        ? `${upcomingBookings.length} upcoming session${upcomingBookings.length === 1 ? "" : "s"}`
        : "Your studio at a glance";

  useAdminPageMeta({
    title: `${timeGreeting()}, ${user?.name ?? "Studio"}`,
    subtitle,
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border/60 bg-card" />
          ))}
        </div>
        <AdminLoading variant="cards" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <QuickAction to="/admin/photos" icon={Upload} label="Upload photos" primary />
        <QuickAction to="/admin/projects" icon={Plus} label="New project" />
        <QuickAction to="/admin/bookings" icon={CalendarCheck} label="View bookings" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Photos"
          value={photos.length}
          detail={`${publishedPhotos} published`}
          icon={Images}
          to="/admin/photos"
        />
        <StatCard
          label="Projects"
          value={projects.length}
          detail={draftProjects > 0 ? `${draftProjects} draft${draftProjects === 1 ? "" : "s"}` : `${publishedProjects} live`}
          icon={FolderOpen}
          to="/admin/projects"
        />
        <StatCard
          label="Pending bookings"
          value={pendingBookings.length}
          detail={pendingBookings.length > 0 ? "Needs review" : "All caught up"}
          icon={CalendarClock}
          to="/admin/bookings"
          highlight={pendingBookings.length > 0}
        />
        <StatCard
          label="Upcoming shoots"
          value={upcomingBookings.length}
          detail="Confirmed sessions"
          icon={CalendarCheck}
          to="/admin/bookings"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/60 bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-lg">
                {pendingBookings.length > 0 ? "Pending requests" : "Upcoming sessions"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {pendingBookings.length > 0
                  ? "Review and confirm new booking requests"
                  : "Confirmed shoots on your calendar"}
              </p>
            </div>
            <Link
              to="/admin/bookings"
              className="inline-flex items-center gap-1 text-sm text-ember hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {(pendingBookings.length > 0 ? pendingBookings : upcomingBookings).length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No upcoming sessions. New booking requests will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {(pendingBookings.length > 0 ? pendingBookings : upcomingBookings)
                .slice(0, 5)
                .map((booking) => (
                  <li key={booking.id}>
                    <Link
                      to="/admin/bookings/$bookingId"
                      params={{ bookingId: booking.id }}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-secondary/40 sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{booking.client_name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {booking.session_type} · {formatBookingDateTime(booking.shoot_at)}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border/60 bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-lg">Recent projects</h2>
              <p className="text-sm text-muted-foreground">Latest client deliverables</p>
            </div>
            <Link
              to="/admin/projects"
              className="inline-flex items-center gap-1 text-sm text-ember hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">No projects yet.</p>
              <Link
                to="/admin/projects"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-ember hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Create your first project
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    to="/admin/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/40 sm:px-6"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {project.coverUrl ? (
                        <img
                          src={project.coverUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          width={56}
                          height={56}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{project.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {project.client ?? "No client"}
                        {project.shoot_date ? ` · ${formatShootDate(project.shoot_date)}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs",
                        project.published
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {project.published ? "Published" : "Draft"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  to,
  highlight,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Images;
  to: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-glow",
        highlight ? "border-ember/40" : "border-border/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl",
            highlight ? "bg-ember/15 text-ember" : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-4 font-display text-3xl">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </Link>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  primary,
}: {
  to: string;
  icon: typeof Upload;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]",
        primary
          ? "bg-gradient-ember text-primary-foreground shadow-glow"
          : "border border-border bg-card text-foreground hover:bg-secondary",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}
