import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, User2, Tag, Lock } from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { MediaImage } from "@/components/media-image";
import { fetchProjectBySlug } from "@/lib/media";

export const Route = createFileRoute("/projects/$slug")({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Project"} — Ember Lens` },
      { name: "description", content: loaderData?.description ?? "Project by Ember Lens." },
      { property: "og:image", content: loaderData?.cover ?? "" },
    ],
  }),
  loader: async ({ params }) => {
    const project = await fetchProjectBySlug({ data: { slug: params.slug } });
    if (!project) throw notFound();
    return project;
  },
  component: ProjectDetail,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="font-display text-4xl">Project not found</h1>
        <Link
          to="/projects"
          className="mt-6 inline-flex rounded-full bg-gradient-ember px-5 py-2.5 text-sm text-primary-foreground shadow-glow"
        >
          Back to projects
        </Link>
      </div>
    </div>
  ),
});

function ProjectDetail() {
  const project = Route.useLoaderData();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = project.images.map((photo) => ({
    src: photo.src,
    title: photo.title,
    watermarked: photo.watermarked,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {project.cover ? (
            <MediaImage
              src={project.cover}
              alt={project.title}
              watermarked={!project.clientPaid}
              width={1920}
              height={900}
              className="h-full w-full object-cover opacity-50"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-24 sm:px-6">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All projects
          </Link>
          <p className="mt-8 text-sm uppercase tracking-[0.2em] text-ember">{project.category}</p>
          <h1 className="mt-2 font-display text-4xl sm:text-6xl">{project.title}</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">{project.description}</p>
          {!project.clientPaid && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
              <Lock className="h-3.5 w-3.5" /> Preview gallery — watermarked until delivery
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <User2 className="h-4 w-4 text-ember" /> {project.client ?? "Private"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-ember" /> {project.date}
            </span>
            <span className="inline-flex items-center gap-2">
              <Tag className="h-4 w-4 text-ember" /> {project.category}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground">No photos in this project yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {items.map((it, i) => (
              <PhotoCard
                key={i}
                src={it.src}
                title={it.title}
                watermarked={it.watermarked}
                aspect={i % 3 === 1 ? "portrait" : "landscape"}
                onClick={() => setOpenIndex(i)}
              />
            ))}
          </div>
        )}
      </section>

      <Lightbox
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
      <SiteFooter />
    </div>
  );
}
