import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { useAdminSiteSettings } from "@/lib/admin-queries";
import { siteSettingsQueryKey } from "@/lib/query-keys";
import {
  removeHeroImage,
  updateSiteSettings,
  uploadHeroImage,
} from "@/lib/site-settings";
import {
  toSiteSettingsForm,
  type SiteSettings,
  type SiteSettingsForm,
  type SiteService,
} from "@/lib/site-settings-types";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Ember Lens Studio" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const { data, isPending, isError, error: loadError } = useAdminSiteSettings();
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updateSiteSettings);
  const uploadHeroFn = useServerFn(uploadHeroImage);
  const removeHeroFn = useServerFn(removeHeroImage);
  const heroRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<SiteSettingsForm | null>(null);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm(toSiteSettingsForm(data));
    setHeroUrl(data.hero_image_url);
  }, [data]);

  useAdminPageMeta({ title: "Settings", subtitle: "Manage your public studio site." });

  function syncSettings(settings: SiteSettings) {
    queryClient.setQueryData(siteSettingsQueryKey, settings);
    setForm(toSiteSettingsForm(settings));
    setHeroUrl(settings.hero_image_url);
  }

  function updateField<K extends keyof SiteSettingsForm>(key: K, value: SiteSettingsForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateService(index: number, patch: Partial<SiteService>) {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.map((service, i) =>
          i === index ? { ...service, ...patch } : service,
        ),
      };
    });
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const result = await updateFn({ data: form });
    setSaving(false);

    if (result.error || !result.settings) {
      setError(result.error ?? "Could not save settings.");
      return;
    }

    syncSettings(result.settings);
    setMessage("Settings saved.");
  }

  async function handleHeroUpload(file: File) {
    setUploadingHero(true);
    setError(null);
    setMessage(null);

    try {
      const base64 = await fileToBase64(file);
      const result = await uploadHeroFn({
        data: {
          fileBase64: base64,
          mimeType: file.type || "image/jpeg",
          filename: file.name,
        },
      });

      if (result.error || !result.settings) {
        setError(result.error ?? "Could not upload hero image.");
        return;
      }

      syncSettings(result.settings);
      setMessage("Hero image updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload hero image.");
    } finally {
      setUploadingHero(false);
      if (heroRef.current) heroRef.current.value = "";
    }
  }

  async function handleRemoveHero() {
    setUploadingHero(true);
    setError(null);
    const result = await removeHeroFn();
    setUploadingHero(false);

    if (result.error || !result.settings) {
      setError(result.error ?? "Could not remove hero image.");
      return;
    }

    syncSettings(result.settings);
    setMessage("Hero image removed.");
  }

  if (isPending || !form) {
    return <AdminLoading variant="form" />;
  }

  return (
    <>
      {message && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {message}
        </p>
      )}
      {(error || isError) && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error ?? (loadError instanceof Error ? loadError.message : "Could not load settings.")}
        </p>
      )}

      <div className="space-y-6">
        <SettingsSection
          title="Studio"
          description="Core details shown across your public site."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Studio name"
              value={form.studio_name}
              onChange={(value) => updateField("studio_name", value)}
            />
            <Field
              label="Tagline"
              value={form.tagline}
              onChange={(value) => updateField("tagline", value)}
            />
            <Field
              label="Location"
              value={form.location}
              onChange={(value) => updateField("location", value)}
              className="sm:col-span-2"
            />
            <TextArea
              label="Bio"
              rows={4}
              value={form.bio}
              onChange={(value) => updateField("bio", value)}
              className="sm:col-span-2"
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Hero"
          description="Homepage hero image and headline copy."
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div>
              <p className="text-sm text-muted-foreground">Hero image</p>
              <div className="mt-2 overflow-hidden rounded-2xl border border-border/60 bg-secondary">
                {heroUrl ? (
                  <img src={heroUrl} alt="" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center text-sm text-muted-foreground">
                    No hero image yet
                  </div>
                )}
              </div>
              <input
                ref={heroRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleHeroUpload(file);
                }}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploadingHero}
                  onClick={() => heroRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-secondary disabled:opacity-60"
                >
                  {uploadingHero ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {heroUrl ? "Replace image" : "Upload image"}
                </button>
                {heroUrl && (
                  <button
                    type="button"
                    disabled={uploadingHero}
                    onClick={() => void handleRemoveHero()}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-destructive disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <Field
                label="Hero title"
                value={form.hero_title}
                onChange={(value) => updateField("hero_title", value)}
              />
              <TextArea
                label="Hero text"
                rows={5}
                value={form.hero_text}
                onChange={(value) => updateField("hero_text", value)}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Footer"
          description="Footer columns and copyright line."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Footer tagline"
              value={form.footer_tagline}
              onChange={(value) => updateField("footer_tagline", value)}
              className="sm:col-span-2"
            />
            <Field
              label="Studio column heading"
              value={form.footer_studio_heading}
              onChange={(value) => updateField("footer_studio_heading", value)}
            />
            <Field
              label="Contact column heading"
              value={form.footer_contact_heading}
              onChange={(value) => updateField("footer_contact_heading", value)}
            />
            <TextArea
              label="Studio column content"
              hint="One line per row"
              rows={3}
              value={form.footer_studio_body}
              onChange={(value) => updateField("footer_studio_body", value)}
            />
            <TextArea
              label="Contact column content"
              hint="One line per row"
              rows={3}
              value={form.footer_contact_body}
              onChange={(value) => updateField("footer_contact_body", value)}
            />
            <Field
              label="Copyright"
              value={form.footer_copyright}
              onChange={(value) => updateField("footer_copyright", value)}
              className="sm:col-span-2"
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Services"
          description="Homepage services cards shown on the front page."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Eyebrow"
              value={form.services_eyebrow}
              onChange={(value) => updateField("services_eyebrow", value)}
            />
            <Field
              label="Section title"
              value={form.services_title}
              onChange={(value) => updateField("services_title", value)}
            />
          </div>
          <div className="mt-6 space-y-4">
            {form.services.map((service, index) => (
              <div key={index} className="rounded-xl border border-border/60 bg-background/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Service {index + 1}</p>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "services",
                        form.services.filter((_, i) => i !== index),
                      )
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive"
                    aria-label="Remove service"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Title"
                    value={service.title}
                    onChange={(value) => updateService(index, { title: value })}
                  />
                  <Field
                    label="Price"
                    value={service.price}
                    onChange={(value) => updateService(index, { price: value })}
                  />
                  <TextArea
                    label="Description"
                    rows={3}
                    value={service.description}
                    onChange={(value) => updateService(index, { description: value })}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateField("services", [
                  ...form.services,
                  { title: "", description: "", price: "" },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
            >
              <Plus className="h-4 w-4" /> Add service
            </button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Gallery"
          description="Public gallery page header and behavior."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Eyebrow"
              value={form.gallery_eyebrow}
              onChange={(value) => updateField("gallery_eyebrow", value)}
            />
            <ToggleRow
              label="Show category filters"
              description="Let visitors filter the gallery by category."
              checked={form.gallery_show_categories}
              onChange={(checked) => updateField("gallery_show_categories", checked)}
            />
            <Field
              label="Page title"
              value={form.gallery_title}
              onChange={(value) => updateField("gallery_title", value)}
              className="sm:col-span-2"
            />
            <TextArea
              label="Page description"
              rows={3}
              value={form.gallery_description}
              onChange={(value) => updateField("gallery_description", value)}
              className="sm:col-span-2"
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Projects"
          description="Public projects listing page header."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Eyebrow"
              value={form.projects_eyebrow}
              onChange={(value) => updateField("projects_eyebrow", value)}
              className="sm:col-span-2"
            />
            <Field
              label="Page title"
              value={form.projects_title}
              onChange={(value) => updateField("projects_title", value)}
              className="sm:col-span-2"
            />
            <TextArea
              label="Page description"
              rows={3}
              value={form.projects_description}
              onChange={(value) => updateField("projects_description", value)}
              className="sm:col-span-2"
            />
          </div>
        </SettingsSection>
      </div>

      <div className="sticky bottom-4 mt-8 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-full bg-gradient-ember px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
      <h2 className="font-display text-lg">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ember"
      />
    </label>
  );
}

function TextArea({
  label,
  hint,
  rows,
  value,
  onChange,
  className,
}: {
  label: string;
  hint?: string;
  rows: number;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted-foreground/80">({hint})</span>}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ember"
      />
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 px-4 py-3 sm:col-span-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-ember" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </button>
    </label>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
