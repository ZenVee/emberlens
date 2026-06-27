import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { fetchPublishedPhotos } from "@/lib/media";
import { PHOTO_CATEGORIES } from "@/lib/media-types";
import { useSiteSettings } from "@/lib/site-settings-queries";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings-types";

export const Route = createFileRoute("/gallery")({
  head: ({ match }) => {
    const settings = match.context.settings ?? DEFAULT_SITE_SETTINGS;
    return {
      meta: [
        { title: `${settings.gallery_title} — ${settings.studio_name}` },
        { name: "description", content: settings.gallery_description },
      ],
    };
  },
  loader: () => fetchPublishedPhotos(),
  component: GalleryPage,
});

const categories = ["All", ...PHOTO_CATEGORIES] as const;

function GalleryPage() {
  const settings = useSiteSettings();
  const photos = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (filter === "All" ? photos : photos.filter((p) => p.category === filter)),
    [filter, photos],
  );

  const lightboxItems = filtered.map((p) => ({ src: p.src, title: p.title }));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6">
        <p className="text-sm uppercase tracking-[0.2em] text-ember">{settings.gallery_eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">{settings.gallery_title}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{settings.gallery_description}</p>

        {settings.gallery_show_categories && (
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
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center text-muted-foreground">
            No published photos yet. Check back soon.
          </p>
        ) : (
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
        )}
      </section>

      <Lightbox
        items={lightboxItems}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
      <SiteFooter />
    </div>
  );
}
