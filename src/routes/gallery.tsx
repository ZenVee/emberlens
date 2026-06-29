import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { EditorialMasonryGallery } from "@/components/editorial-masonry-gallery";
import { Lightbox } from "@/components/lightbox";
import { fetchPublishedPhotos } from "@/lib/media";
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

function GalleryPage() {
  const settings = useSiteSettings();
  const categories = useMemo(
    () => ["All", ...settings.photo_categories] as const,
    [settings.photo_categories],
  );
  const photos = Route.useLoaderData();
  const [filter, setFilter] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (filter === "All" ? photos : photos.filter((p) => p.category === filter)),
    [filter, photos],
  );

  const lightboxItems = filtered.map((p) => ({
    src: p.src,
    title: p.title,
    watermarked: p.watermarked,
  }));

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

      <section className="mx-auto max-w-[90rem] px-2 pb-24 sm:px-3">
        {filtered.length === 0 ? (
          <p className="rounded-sm border border-dashed border-border/60 px-6 py-16 text-center text-muted-foreground">
            No published photos yet. Check back soon.
          </p>
        ) : (
          <EditorialMasonryGallery
            items={filtered.map((p) => ({
              id: p.id,
              src: p.src,
              title: p.title,
              subtitle: p.category,
              watermarked: p.watermarked,
              orientation: p.gallery_orientation,
            }))}
            onItemClick={setOpenIndex}
          />
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
