import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { MediaImage } from "@/components/media-image";
import { PLACEHOLDER_IMAGE } from "@/lib/placeholder-image";
import { fetchPublishedProjects } from "@/lib/media";
import { publicGalleryWatermarked } from "@/lib/media-types";
import { useSiteSettings } from "@/lib/site-settings-queries";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings-types";

export const Route = createFileRoute("/projects")({
  head: ({ match }) => {
    const settings = match.context.settings ?? DEFAULT_SITE_SETTINGS;
    return {
      meta: [
        { title: `${settings.projects_title} — ${settings.studio_name}` },
        { name: "description", content: settings.projects_description },
      ],
    };
  },
  loader: () => fetchPublishedProjects(),
  component: ProjectsLayout,
});

function ProjectsLayout() {
  const settings = useSiteSettings();
  const projects = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/projects") return <Outlet />;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6">
        <p className="text-sm uppercase tracking-[0.2em] text-ember">{settings.projects_eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">{settings.projects_title}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{settings.projects_description}</p>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {projects.length === 0 ? (
          <p className="col-span-full rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center text-muted-foreground">
            No published projects yet.
          </p>
        ) : (
          projects.map((pr) => (
            <Link
              key={pr.id}
              to="/projects/$slug"
              params={{ slug: pr.slug }}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-1 hover:border-ember/60 hover:shadow-glow"
            >
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <MediaImage
                  src={pr.cover || PLACEHOLDER_IMAGE}
                  alt={pr.title}
                  watermarked={Boolean(pr.cover) && publicGalleryWatermarked({
                    client_paid_at: pr.clientPaid ? "paid" : null,
                    public_watermarked: pr.publicWatermarked,
                  })}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-ember">
                    {pr.category ?? "Project"}
                  </span>
                  <span className="text-muted-foreground">{pr.date}</span>
                </div>
                <h3 className="mt-3 font-display text-xl">{pr.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pr.description}</p>
              </div>
            </Link>
          ))
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
