import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, User2, Tag } from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { projects } from "@/lib/mock-data";

export const Route = createFileRoute("/projects/$slug")({
  head: ({ params }) => {
    const pr = projects.find((p) => p.slug === params.slug);
    return {
      meta: [
        { title: `${pr?.title ?? "Project"} — Ember Lens` },
        { name: "description", content: pr?.description ?? "Project by Ember Lens." },
        { property: "og:image", content: pr?.cover ?? "" },
      ],
    };
  },
  loader: ({ params }) => {
    const project = projects.find((p) => p.slug === params.slug);
    if (!project) throw notFound();
    return { project };
  },
  component: ProjectDetail,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="font-display text-4xl">Project not found</h1>
        <Link to="/projects" className="mt-6 inline-flex rounded-full bg-gradient-ember px-5 py-2.5 text-sm text-primary-foreground shadow-glow">
          Back to projects
        </Link>
      </div>
    </div>
  ),
});

function ProjectDetail() {
  const { project } = Route.useLoaderData();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = project.images.map((src: string, i: number) => ({ src, title: `${project.title} — ${i + 1}` }));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={project.cover} alt={project.title} width={1920} height={900} className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-24 sm:px-6">
          <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All projects
          </Link>
          <p className="mt-8 text-sm uppercase tracking-[0.2em] text-ember">{project.category}</p>
          <h1 className="mt-2 font-display text-4xl sm:text-6xl">{project.title}</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">{project.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><User2 className="h-4 w-4 text-ember" /> {project.client}</span>
            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-ember" /> {project.date}</span>
            <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4 text-ember" /> {project.category}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((it: { src: string; title: string }, i: number) => (
            <PhotoCard
              key={i}
              src={it.src}
              title={it.title}
              aspect={i % 3 === 1 ? "portrait" : "landscape"}
              onClick={() => setOpenIndex(i)}
            />
          ))}
        </div>
      </section>

      <Lightbox items={items} index={openIndex} onClose={() => setOpenIndex(null)} onIndexChange={setOpenIndex} />
      <SiteFooter />
    </div>
  );
}
