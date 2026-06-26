import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { projects } from "@/lib/mock-data";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Ember Lens" },
      { name: "description", content: "Selected projects from Ember Lens — Los Santos cinematic photography." },
    ],
  }),
  component: ProjectsLayout,
});

function ProjectsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/projects") return <Outlet />;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6">
        <p className="text-sm uppercase tracking-[0.2em] text-ember">Projects</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Selected work</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          A curated set of recent projects across portraits, automotive, events, and editorial.
        </p>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {projects.map((pr) => (
          <Link
            key={pr.id}
            to="/projects/$slug"
            params={{ slug: pr.slug }}
            className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-1 hover:border-ember/60 hover:shadow-glow"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img src={pr.cover} alt={pr.title} loading="lazy" width={800} height={600} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-ember">{pr.category}</span>
                <span className="text-muted-foreground">{pr.date}</span>
              </div>
              <h3 className="mt-3 font-display text-xl">{pr.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pr.description}</p>
            </div>
          </Link>
        ))}
      </section>
      <SiteFooter />
    </div>
  );
}
