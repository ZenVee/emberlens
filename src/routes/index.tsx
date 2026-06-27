import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, Sparkles, MapPin, Mail } from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { PhotoCard } from "@/components/photo-card";
import { MediaImage } from "@/components/media-image";
import { heroImage } from "@/lib/mock-data";
import { fetchFeaturedPhotos, fetchPublishedProjects } from "@/lib/media";
import { publicGalleryWatermarked } from "@/lib/media-types";
import { useSiteSettings } from "@/lib/site-settings-queries";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings-types";

export const Route = createFileRoute("/")({
  head: ({ match }) => {
    const settings = match.context.settings ?? DEFAULT_SITE_SETTINGS;
    return {
      meta: [
        { title: `${settings.studio_name} — ${settings.tagline}` },
        { name: "description", content: settings.bio || settings.hero_text },
      ],
    };
  },
  loader: async () => {
    const [featuredPhotos, recentProjects] = await Promise.all([
      fetchFeaturedPhotos(),
      fetchPublishedProjects(),
    ]);
    return { featuredPhotos, recentProjects };
  },
  component: Index,
});

function Index() {
  const settings = useSiteSettings();
  const { featuredPhotos, recentProjects } = Route.useLoaderData();
  const heroSrc = settings.hero_image_url ?? heroImage;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroSrc}
            alt=""
            width={1920}
            height={1080}
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pt-24 pb-32 text-center sm:px-6 md:pt-36 md:pb-44">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-ember" />
            {settings.tagline}
          </span>
          <h1 className="max-w-4xl font-display text-5xl leading-[1.05] sm:text-6xl md:text-7xl">
            {settings.hero_title}
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">{settings.hero_text}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-ember px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.03]"
            >
              Book a session <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-6 py-3 text-sm font-medium text-foreground backdrop-blur hover:bg-secondary"
            >
              View the gallery
            </Link>
          </div>

          <div className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-4 text-center">
            {[
              { k: "200+", v: "Shoots" },
              { k: "5★", v: "Avg. rating" },
              { k: "24h", v: "Turnaround" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
                <p className="font-display text-2xl text-gradient-ember">{s.k}</p>
                <p className="text-xs text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED GALLERY */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-ember">Featured</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Recent frames</h2>
          </div>
          <Link to="/gallery" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            See full gallery <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featuredPhotos.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">Featured photos will appear here once published.</p>
          ) : (
            featuredPhotos.map((p, i) => (
              <PhotoCard
                key={p.id}
                src={p.src}
                title={p.title}
                subtitle={p.category}
                aspect={i % 5 === 0 ? "portrait" : "square"}
              />
            ))
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 rounded-3xl border border-border/60 bg-gradient-night p-8 shadow-card md:grid-cols-2 md:p-14">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-ember">About {settings.studio_name}</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">A cozy lens on a loud city.</h2>
            <p className="mt-5 text-muted-foreground">{settings.bio}</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-ember"><Camera className="h-3.5 w-3.5" /></span>Cinematic color grading, every delivery</li>
              <li className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-ember"><Sparkles className="h-3.5 w-3.5" /></span>24-hour preview turnaround</li>
              <li className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-ember"><MapPin className="h-3.5 w-3.5" /></span>{settings.location}</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {featuredPhotos[0] ? (
              <img src={featuredPhotos[0].src} alt="" loading="lazy" width={600} height={800} className="aspect-[3/4] w-full rounded-2xl object-cover shadow-card" />
            ) : (
              <img src={heroSrc} alt="" loading="lazy" width={600} height={800} className="aspect-[3/4] w-full rounded-2xl object-cover shadow-card" />
            )}
            {featuredPhotos[1] ? (
              <img src={featuredPhotos[1].src} alt="" loading="lazy" width={600} height={600} className="mt-8 aspect-square w-full rounded-2xl object-cover shadow-card" />
            ) : (
              <img src={heroSrc} alt="" loading="lazy" width={600} height={600} className="mt-8 aspect-square w-full rounded-2xl object-cover shadow-card" />
            )}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-ember">{settings.services_eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">{settings.services_title}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {settings.services.map((s) => (
            <div
              key={s.title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-ember/60 hover:shadow-glow"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-ember text-primary-foreground">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              <p className="mt-5 text-sm font-medium text-ember">{s.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT PROJECTS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-ember">{settings.projects_eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">{settings.projects_title}</h2>
          </div>
          <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            All projects <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {recentProjects.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">Published projects will appear here.</p>
          ) : (
            recentProjects.slice(0, 3).map((pr) => (
              <Link
                key={pr.id}
                to="/projects/$slug"
                params={{ slug: pr.slug }}
                className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  {pr.cover ? (
                    <MediaImage
                      src={pr.cover}
                      alt={pr.title}
                      watermarked={publicGalleryWatermarked({
                        client_paid_at: pr.clientPaid ? "paid" : null,
                        public_watermarked: pr.publicWatermarked,
                      })}
                      loading="lazy"
                      width={800}
                      height={600}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide text-ember">{pr.category}</p>
                  <h3 className="mt-1 font-display text-xl">{pr.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{pr.client} · {pr.date}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* CONTACT / BOOKING PREVIEW */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-night p-8 shadow-card md:p-12">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-ember">Book a session</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Let's make something warm.</h2>
            <p className="mt-3 text-sm text-muted-foreground">Tell us about your shoot. We'll get back within 2 hours.</p>
          </div>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
            <input className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-ember" placeholder="Your name" />
            <input className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-ember" placeholder="Your name" />
            <select className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-ember sm:col-span-2">
              <option>Portrait session</option>
              <option>Automotive shoot</option>
              <option>Event coverage</option>
              <option>Lifestyle / Travel</option>
            </select>
            <textarea rows={4} className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-ember sm:col-span-2" placeholder="Tell us about the vibe, location, date…" />
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-ember px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow sm:col-span-2">
              <Mail className="h-4 w-4" /> Send request
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
