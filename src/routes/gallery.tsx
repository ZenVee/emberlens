import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { photos } from "@/lib/mock-data";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Ember Lens" },
      { name: "description", content: "Cinematic photo gallery from Ember Lens — portraits, events, automotive, street." },
    ],
  }),
  component: GalleryPage,
});

const categories = ["All", "Portrait", "Automotive", "Event", "Street", "Lifestyle", "Cityscape"] as const;

function GalleryPage() {
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (filter === "All" ? photos : photos.filter((p) => p.category === filter)),
    [filter],
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6">
        <p className="text-sm uppercase tracking-[0.2em] text-ember">Gallery</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">The full archive</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Click any frame to view it full-screen. Filtered by category, refreshed monthly.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                filter === c
                  ? "border-ember bg-gradient-ember text-primary-foreground shadow-glow"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <PhotoCard
              key={p.id}
              src={p.src}
              title={p.title}
              subtitle={p.category}
              aspect={i % 4 === 1 ? "portrait" : i % 4 === 2 ? "landscape" : "square"}
              onClick={() => setOpenIndex(i)}
            />
          ))}
        </div>
      </section>

      <Lightbox items={filtered} index={openIndex} onClose={() => setOpenIndex(null)} onIndexChange={setOpenIndex} />
      <SiteFooter />
    </div>
  );
}
