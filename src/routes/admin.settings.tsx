import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2,
  FileText,
  Home,
  ImagePlus,
  Loader2,
  Palette,
  PanelBottom,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { SaveStatus } from "@/components/save-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAutoSave } from "@/hooks/use-auto-save";
import {
  applySiteTheme,
  pickSiteTheme,
  THEME_BORDER_RADIUS_OPTIONS,
  THEME_FONT_DISPLAY_OPTIONS,
  THEME_FONT_SANS_OPTIONS,
} from "@/lib/site-theme";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "brand", label: "Brand", icon: Building2 },
  { value: "homepage", label: "Homepage", icon: Home },
  { value: "pages", label: "Pages", icon: FileText },
  { value: "theme", label: "Theme", icon: Palette },
  { value: "footer", label: "Footer", icon: PanelBottom },
] as const;

type SettingsTab = (typeof TABS)[number]["value"];

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
  const [activeTab, setActiveTab] = useState<SettingsTab>("brand");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm(toSiteSettingsForm(data));
    setHeroUrl(data.hero_image_url);
  }, [data]);

  useAdminPageMeta({
    title: "Settings",
    subtitle: "Brand, homepage copy, theme, and public page content.",
  });

  useEffect(() => {
    if (!form) return;
    applySiteTheme(pickSiteTheme(form));
  }, [form]);

  const persistSettings = useCallback(
    async (next: SiteSettingsForm) => {
      const result = await updateFn({ data: next });
      if (result.error || !result.settings) {
        return { ok: false as const, error: result.error ?? "Could not save settings." };
      }
      queryClient.setQueryData(siteSettingsQueryKey, result.settings);
      return { ok: true as const };
    },
    [queryClient, updateFn],
  );

  const { status: saveStatus, error: saveError, syncBaseline } = useAutoSave(form, persistSettings, {
    enabled: form !== null,
  });

  function syncSettings(settings: SiteSettings) {
    queryClient.setQueryData(siteSettingsQueryKey, settings);
    const nextForm = toSiteSettingsForm(settings);
    setForm(nextForm);
    setHeroUrl(settings.hero_image_url);
    syncBaseline(nextForm);
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

  function updateCategoryList(
    key: "photo_categories" | "project_categories" | "session_types",
    index: number,
    value: string,
  ) {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: prev[key].map((item, i) => (i === index ? value : item)),
      };
    });
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
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)} className="space-y-6">
      {(message || error || saveError || isError) && (
        <div className="space-y-2">
          {message && (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
              {message}
            </p>
          )}
          {(error || saveError || isError) && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error ??
                saveError ??
                (loadError instanceof Error ? loadError.message : "Could not load settings.")}
            </p>
          )}
        </div>
      )}

      <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:-mx-8 md:px-8">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-secondary/60 p-1 sm:w-auto">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-1.5 px-3 py-2 data-[state=active]:shadow-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <SaveStatus status={saveStatus} error={saveError} className="shrink-0" />
      </div>

      <TabsContent value="brand" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <SettingsPanel
          title="Studio identity"
          description="Name, location, and bio shown across your public site."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Studio name">
              <Input
                value={form.studio_name}
                onChange={(e) => updateField("studio_name", e.target.value)}
              />
            </FormField>
            <FormField label="Tagline">
              <Input
                value={form.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
              />
            </FormField>
            <FormField label="Location" className="sm:col-span-2">
              <Input
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </FormField>
            <FormField label="Bio" className="sm:col-span-2">
              <Textarea
                rows={4}
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
              />
            </FormField>
          </div>
        </SettingsPanel>
      </TabsContent>

      <TabsContent value="homepage" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
        <SettingsPanel
          title="Hero"
          description="Homepage banner image and headline."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Hero image</Label>
              <div className="mt-2 overflow-hidden rounded-xl border border-border bg-secondary/50">
                {heroUrl ? (
                  <img src={heroUrl} alt="" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ImagePlus className="h-6 w-6 opacity-50" />
                    No image yet
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingHero}
                  onClick={() => heroRef.current?.click()}
                  className="rounded-full"
                >
                  {uploadingHero ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ImagePlus />
                  )}
                  {heroUrl ? "Replace" : "Upload"}
                </Button>
                {heroUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploadingHero}
                    onClick={() => void handleRemoveHero()}
                    className="rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 /> Remove
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-5">
              <FormField label="Headline">
                <Input
                  value={form.hero_title}
                  onChange={(e) => updateField("hero_title", e.target.value)}
                />
              </FormField>
              <FormField label="Supporting text">
                <Textarea
                  rows={5}
                  value={form.hero_text}
                  onChange={(e) => updateField("hero_text", e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </SettingsPanel>

        <SettingsPanel
          title="Services"
          description="Cards displayed on the homepage."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Section eyebrow">
              <Input
                value={form.services_eyebrow}
                onChange={(e) => updateField("services_eyebrow", e.target.value)}
              />
            </FormField>
            <FormField label="Section title">
              <Input
                value={form.services_title}
                onChange={(e) => updateField("services_title", e.target.value)}
              />
            </FormField>
          </div>

          <div className="mt-6 space-y-3">
            {form.services.map((service, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/60 bg-background/40 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      updateField(
                        "services",
                        form.services.filter((_, i) => i !== index),
                      )
                    }
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove service ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Title">
                    <Input
                      value={service.title}
                      onChange={(e) => updateService(index, { title: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Price">
                    <Input
                      value={service.price}
                      onChange={(e) => updateService(index, { price: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Description" className="sm:col-span-2">
                    <Textarea
                      rows={2}
                      value={service.description}
                      onChange={(e) => updateService(index, { description: e.target.value })}
                    />
                  </FormField>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateField("services", [
                  ...form.services,
                  { title: "", description: "", price: "" },
                ])
              }
              className="rounded-full"
            >
              <Plus /> Add service
            </Button>
          </div>
        </SettingsPanel>
      </TabsContent>

      <TabsContent value="pages" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <SettingsPanel
            title="Gallery page"
            description="Header copy for the public gallery."
          >
            <div className="space-y-5">
              <FormField label="Eyebrow">
                <Input
                  value={form.gallery_eyebrow}
                  onChange={(e) => updateField("gallery_eyebrow", e.target.value)}
                />
              </FormField>
              <FormField label="Page title">
                <Input
                  value={form.gallery_title}
                  onChange={(e) => updateField("gallery_title", e.target.value)}
                />
              </FormField>
              <FormField label="Page description">
                <Textarea
                  rows={3}
                  value={form.gallery_description}
                  onChange={(e) => updateField("gallery_description", e.target.value)}
                />
              </FormField>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="gallery-categories">Category filters</Label>
                  <p className="text-xs text-muted-foreground">
                    Let visitors filter photos by category.
                  </p>
                </div>
                <Switch
                  id="gallery-categories"
                  checked={form.gallery_show_categories}
                  onCheckedChange={(checked) => updateField("gallery_show_categories", checked)}
                />
              </div>
            </div>
          </SettingsPanel>

          <SettingsPanel
            title="Projects page"
            description="Header copy for the public projects list."
          >
            <div className="space-y-5">
              <FormField label="Eyebrow">
                <Input
                  value={form.projects_eyebrow}
                  onChange={(e) => updateField("projects_eyebrow", e.target.value)}
                />
              </FormField>
              <FormField label="Page title">
                <Input
                  value={form.projects_title}
                  onChange={(e) => updateField("projects_title", e.target.value)}
                />
              </FormField>
              <FormField label="Page description">
                <Textarea
                  rows={3}
                  value={form.projects_description}
                  onChange={(e) => updateField("projects_description", e.target.value)}
                />
              </FormField>
            </div>
          </SettingsPanel>
        </div>

        <SettingsPanel
          title="Categories & bookings"
          description="Labels for photos, projects, and booking session types."
          className="mt-6"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <CategoryListEditor
              label="Photo categories"
              hint="Shown in the gallery filter and photo upload form."
              items={form.photo_categories}
              onChange={(items) => updateField("photo_categories", items)}
              onItemChange={(index, value) => updateCategoryList("photo_categories", index, value)}
            />
            <CategoryListEditor
              label="Project categories"
              hint="Used when creating and editing projects."
              items={form.project_categories}
              onChange={(items) => updateField("project_categories", items)}
              onItemChange={(index, value) => updateCategoryList("project_categories", index, value)}
            />
            <CategoryListEditor
              label="Session types"
              hint="Options when adding bookings and on the homepage booking form."
              placeholder="Session type"
              addLabel="Add session type"
              items={form.session_types}
              onChange={(items) => updateField("session_types", items)}
              onItemChange={(index, value) => updateCategoryList("session_types", index, value)}
              className="lg:col-span-2"
            />
          </div>
        </SettingsPanel>
      </TabsContent>

      <TabsContent value="theme" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <SettingsPanel
            title="Brand colors"
            description="Primary palette used for buttons, accents, and gradients across the site."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <ColorField
                label="Primary"
                hint="Buttons and links"
                value={form.theme_primary_color}
                onChange={(value) => updateField("theme_primary_color", value)}
              />
              <ColorField
                label="Secondary"
                hint="Subtle backgrounds"
                value={form.theme_secondary_color}
                onChange={(value) => updateField("theme_secondary_color", value)}
              />
              <ColorField
                label="Accent"
                hint="Highlights and gradients"
                value={form.theme_accent_color}
                onChange={(value) => updateField("theme_accent_color", value)}
              />
              <ColorField
                label="Ember"
                hint="Brand accent color"
                value={form.theme_ember_color}
                onChange={(value) => updateField("theme_ember_color", value)}
              />
            </div>
          </SettingsPanel>

          <SettingsPanel
            title="Typography & shape"
            description="Fonts and corner radius for the public site."
          >
            <div className="space-y-5">
              <FormField label="Body font">
                <Select
                  value={form.theme_font_sans}
                  onValueChange={(value) => updateField("theme_font_sans", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEME_FONT_SANS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Heading font">
                <Select
                  value={form.theme_font_display}
                  onValueChange={(value) => updateField("theme_font_display", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEME_FONT_DISPLAY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Corner radius">
                <Select
                  value={form.theme_border_radius}
                  onValueChange={(value) => updateField("theme_border_radius", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEME_BORDER_RADIUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </SettingsPanel>
        </div>

        <SettingsPanel
          title="Preview"
          description="How your theme looks with current settings."
          className="mt-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Primary", color: form.theme_primary_color },
              { label: "Secondary", color: form.theme_secondary_color },
              { label: "Accent", color: form.theme_accent_color },
              { label: "Ember", color: form.theme_ember_color },
            ].map(({ label, color }) => (
              <div
                key={label}
                className="overflow-hidden rounded-xl border border-border/60"
                style={{ borderRadius: form.theme_border_radius }}
              >
                <div className="h-16" style={{ backgroundColor: color }} />
                <div className="bg-card px-3 py-2 text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <div
            className="mt-5 rounded-xl border border-border/60 bg-card p-5"
            style={{ borderRadius: form.theme_border_radius }}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Sample heading</p>
            <h3
              className="mt-1 text-xl font-medium"
              style={{ fontFamily: `"${form.theme_font_display}", serif` }}
            >
              {form.studio_name || "Studio name"}
            </h3>
            <p
              className="mt-2 text-sm text-muted-foreground"
              style={{ fontFamily: `"${form.theme_font_sans}", sans-serif` }}
            >
              {form.tagline || "Your tagline appears here."}
            </p>
            <button
              type="button"
              className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-medium text-primary-foreground"
              style={{
                backgroundColor: form.theme_primary_color,
                borderRadius: form.theme_border_radius,
              }}
            >
              Sample button
            </button>
          </div>
        </SettingsPanel>
      </TabsContent>

      <TabsContent value="footer" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <SettingsPanel
          title="Site footer"
          description="Columns and copyright shown at the bottom of every page."
        >
          <div className="space-y-5">
            <FormField label="Footer tagline">
              <Input
                value={form.footer_tagline}
                onChange={(e) => updateField("footer_tagline", e.target.value)}
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-5 rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-sm font-medium">Studio column</p>
                <FormField label="Heading">
                  <Input
                    value={form.footer_studio_heading}
                    onChange={(e) => updateField("footer_studio_heading", e.target.value)}
                  />
                </FormField>
                <FormField label="Content" hint="One line per row">
                  <Textarea
                    rows={3}
                    value={form.footer_studio_body}
                    onChange={(e) => updateField("footer_studio_body", e.target.value)}
                  />
                </FormField>
              </div>

              <div className="space-y-5 rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-sm font-medium">Contact column</p>
                <FormField label="Heading">
                  <Input
                    value={form.footer_contact_heading}
                    onChange={(e) => updateField("footer_contact_heading", e.target.value)}
                  />
                </FormField>
                <FormField label="Content" hint="One line per row">
                  <Textarea
                    rows={3}
                    value={form.footer_contact_body}
                    onChange={(e) => updateField("footer_contact_body", e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Copyright line">
              <Input
                value={form.footer_copyright}
                onChange={(e) => updateField("footer_copyright", e.target.value)}
              />
            </FormField>
          </div>
        </SettingsPanel>
      </TabsContent>
    </Tabs>
  );
}

function SettingsPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border/60 bg-card p-5 shadow-card sm:p-6", className)}>
      <header className="mb-5 border-b border-border/40 pb-4">
        <h2 className="font-display text-base font-medium">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

function FormField({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline gap-2">
        <Label className="text-muted-foreground">{label}</Label>
        {hint && <span className="text-xs text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function CategoryListEditor({
  label,
  hint,
  items,
  onChange,
  onItemChange,
  placeholder = "Category name",
  addLabel = "Add category",
  className,
}: {
  label: string;
  hint: string;
  items: string[];
  onChange: (items: string[]) => void;
  onItemChange: (index: number, value: string) => void;
  placeholder?: string;
  addLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => onItemChange(index, e.target.value)}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${label} ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, ""])}
        className="rounded-full"
      >
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label} hint={hint}>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border/60 bg-transparent p-1"
          aria-label={`${label} color picker`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-sm"
        />
      </div>
    </FormField>
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
