import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";

import {
  CategoryListEditor,
  ColorField,
  FormField,
  SettingsPanel,
} from "@/components/admin/settings/settings-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SiteSettingsEditorState } from "@/hooks/admin/use-site-settings-editor";
import {
  THEME_BORDER_RADIUS_OPTIONS,
  THEME_FONT_DISPLAY_OPTIONS,
  THEME_FONT_SANS_OPTIONS,
} from "@/lib/site-theme";

type EditorProps = Pick<
  SiteSettingsEditorState,
  | "form"
  | "updateField"
  | "updateService"
  | "updateCategoryList"
  | "saveOnBlur"
  | "heroUrl"
  | "heroRef"
  | "uploadingHero"
  | "handleHeroUpload"
  | "handleRemoveHero"
>;

function useForm(editor: EditorProps) {
  if (!editor.form) throw new Error("Settings form not loaded");
  return editor.form;
}

export function SettingsBrandTab(editor: EditorProps) {
  const form = useForm(editor);
  return (
    <TabsContent value="brand" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
      <SettingsPanel
        title="Studio identity"
        description="Name, location, and bio shown across your public site."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Studio name">
            <Input
              value={form.studio_name}
              onChange={(e) => editor.updateField("studio_name", e.target.value)}
              onBlur={editor.saveOnBlur}
            />
          </FormField>
          <FormField label="Tagline">
            <Input
              value={form.tagline}
              onChange={(e) => editor.updateField("tagline", e.target.value)}
              onBlur={editor.saveOnBlur}
            />
          </FormField>
          <FormField label="Location" className="sm:col-span-2">
            <Input
              value={form.location}
              onChange={(e) => editor.updateField("location", e.target.value)}
              onBlur={editor.saveOnBlur}
            />
          </FormField>
          <FormField label="Bio" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={form.bio}
              onChange={(e) => editor.updateField("bio", e.target.value)}
              onBlur={editor.saveOnBlur}
            />
          </FormField>
        </div>
      </SettingsPanel>
    </TabsContent>
  );
}

export function SettingsHomepageTab(editor: EditorProps) {
  const form = useForm(editor);
  return (
    <TabsContent
      value="homepage"
      className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0"
    >
      <SettingsPanel title="Hero" description="Homepage banner image and headline.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Hero image</Label>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-secondary/50">
              {editor.heroUrl ? (
                <img src={editor.heroUrl} alt="" className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ImagePlus className="h-6 w-6 opacity-50" />
                  No image yet
                </div>
              )}
            </div>
            <input
              ref={editor.heroRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void editor.handleHeroUpload(file);
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={editor.uploadingHero}
                onClick={() => editor.heroRef.current?.click()}
                className="rounded-full"
              >
                {editor.uploadingHero ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                {editor.heroUrl ? "Replace" : "Upload"}
              </Button>
              {editor.heroUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={editor.uploadingHero}
                  onClick={() => void editor.handleRemoveHero()}
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
                onChange={(e) => editor.updateField("hero_title", e.target.value)}
                onBlur={editor.saveOnBlur}
              />
            </FormField>
            <FormField label="Supporting text">
              <Textarea
                rows={5}
                value={form.hero_text}
                onChange={(e) => editor.updateField("hero_text", e.target.value)}
                onBlur={editor.saveOnBlur}
              />
            </FormField>
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel title="Services" description="Cards displayed on the homepage.">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Section eyebrow">
            <Input
              value={form.services_eyebrow}
              onChange={(e) => editor.updateField("services_eyebrow", e.target.value)}
              onBlur={editor.saveOnBlur}
            />
          </FormField>
          <FormField label="Section title">
            <Input
              value={form.services_title}
              onChange={(e) => editor.updateField("services_title", e.target.value)}
              onBlur={editor.saveOnBlur}
            />
          </FormField>
        </div>

        <div className="mt-6 space-y-3">
          {form.services.map((service, index) => (
            <div key={index} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    editor.updateField(
                      "services",
                      form.services.filter((_, i) => i !== index),
                      { save: true },
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
                    onChange={(e) => editor.updateService(index, { title: e.target.value })}
                    onBlur={editor.saveOnBlur}
                  />
                </FormField>
                <FormField label="Price">
                  <Input
                    value={service.price}
                    onChange={(e) => editor.updateService(index, { price: e.target.value })}
                    onBlur={editor.saveOnBlur}
                  />
                </FormField>
                <FormField label="Description" className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={service.description}
                    onChange={(e) => editor.updateService(index, { description: e.target.value })}
                    onBlur={editor.saveOnBlur}
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
              editor.updateField(
                "services",
                [...form.services, { title: "", description: "", price: "" }],
                { save: true },
              )
            }
            className="rounded-full"
          >
            <Plus /> Add service
          </Button>
        </div>
      </SettingsPanel>
    </TabsContent>
  );
}

export function SettingsPagesTab(editor: EditorProps) {
  const form = useForm(editor);
  return (
    <TabsContent value="pages" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsPanel title="Gallery page" description="Header copy for the public gallery.">
          <div className="space-y-5">
            <FormField label="Eyebrow">
              <Input
                value={form.gallery_eyebrow}
                onChange={(e) => editor.updateField("gallery_eyebrow", e.target.value)}
                onBlur={editor.saveOnBlur}
              />
            </FormField>
            <FormField label="Page title">
              <Input
                value={form.gallery_title}
                onChange={(e) => editor.updateField("gallery_title", e.target.value)}
                onBlur={editor.saveOnBlur}
              />
            </FormField>
            <FormField label="Page description">
              <Textarea
                rows={3}
                value={form.gallery_description}
                onChange={(e) => editor.updateField("gallery_description", e.target.value)}
                onBlur={editor.saveOnBlur}
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
                onCheckedChange={(checked) =>
                  editor.updateField("gallery_show_categories", checked, { save: true })
                }
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
                onChange={(e) => editor.updateField("projects_eyebrow", e.target.value)}
                onBlur={editor.saveOnBlur}
              />
            </FormField>
            <FormField label="Page title">
              <Input
                value={form.projects_title}
                onChange={(e) => editor.updateField("projects_title", e.target.value)}
                onBlur={editor.saveOnBlur}
              />
            </FormField>
            <FormField label="Page description">
              <Textarea
                rows={3}
                value={form.projects_description}
                onChange={(e) => editor.updateField("projects_description", e.target.value)}
                onBlur={editor.saveOnBlur}
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
            onChange={(items) => editor.updateField("photo_categories", items, { save: true })}
            onItemChange={(index, value) =>
              editor.updateCategoryList("photo_categories", index, value)
            }
            onBlur={editor.saveOnBlur}
          />
          <CategoryListEditor
            label="Project categories"
            hint="Used when creating and editing projects."
            items={form.project_categories}
            onChange={(items) => editor.updateField("project_categories", items, { save: true })}
            onItemChange={(index, value) =>
              editor.updateCategoryList("project_categories", index, value)
            }
            onBlur={editor.saveOnBlur}
          />
          <CategoryListEditor
            label="Session types"
            hint="Options when adding bookings and on the homepage booking form."
            placeholder="Session type"
            addLabel="Add session type"
            items={form.session_types}
            onChange={(items) => editor.updateField("session_types", items, { save: true })}
            onItemChange={(index, value) =>
              editor.updateCategoryList("session_types", index, value)
            }
            onBlur={editor.saveOnBlur}
            className="lg:col-span-2"
          />
        </div>
      </SettingsPanel>
    </TabsContent>
  );
}

export function SettingsThemeTab(
  editor: Pick<SiteSettingsEditorState, "form" | "updateField" | "saveOnBlur">,
) {
  const form = useForm(editor);
  return (
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
              onChange={(value) => editor.updateField("theme_primary_color", value)}
              onBlur={editor.saveOnBlur}
            />
            <ColorField
              label="Secondary"
              hint="Subtle backgrounds"
              value={form.theme_secondary_color}
              onChange={(value) => editor.updateField("theme_secondary_color", value)}
              onBlur={editor.saveOnBlur}
            />
            <ColorField
              label="Accent"
              hint="Highlights and gradients"
              value={form.theme_accent_color}
              onChange={(value) => editor.updateField("theme_accent_color", value)}
              onBlur={editor.saveOnBlur}
            />
            <ColorField
              label="Ember"
              hint="Brand accent color"
              value={form.theme_ember_color}
              onChange={(value) => editor.updateField("theme_ember_color", value)}
              onBlur={editor.saveOnBlur}
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
                onValueChange={(value) =>
                  editor.updateField("theme_font_sans", value, { save: true })
                }
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
                onValueChange={(value) =>
                  editor.updateField("theme_font_display", value, { save: true })
                }
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
                onValueChange={(value) =>
                  editor.updateField("theme_border_radius", value, { save: true })
                }
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
  );
}

export function SettingsFooterTab(
  editor: Pick<SiteSettingsEditorState, "form" | "updateField" | "saveOnBlur">,
) {
  const form = useForm(editor);
  return (
    <TabsContent value="footer" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
      <SettingsPanel
        title="Site footer"
        description="Columns and copyright shown at the bottom of every page."
      >
        <div className="space-y-5">
          <FormField label="Footer tagline">
            <Input
              value={form.footer_tagline}
              onChange={(e) => editor.updateField("footer_tagline", e.target.value)}
              onBlur={editor.saveOnBlur}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-5 rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-sm font-medium">Studio column</p>
              <FormField label="Heading">
                <Input
                  value={form.footer_studio_heading}
                  onChange={(e) => editor.updateField("footer_studio_heading", e.target.value)}
                  onBlur={editor.saveOnBlur}
                />
              </FormField>
              <FormField label="Content" hint="One line per row">
                <Textarea
                  rows={3}
                  value={form.footer_studio_body}
                  onChange={(e) => editor.updateField("footer_studio_body", e.target.value)}
                  onBlur={editor.saveOnBlur}
                />
              </FormField>
            </div>

            <div className="space-y-5 rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-sm font-medium">Contact column</p>
              <FormField label="Heading">
                <Input
                  value={form.footer_contact_heading}
                  onChange={(e) => editor.updateField("footer_contact_heading", e.target.value)}
                  onBlur={editor.saveOnBlur}
                />
              </FormField>
              <FormField label="Content" hint="One line per row">
                <Textarea
                  rows={3}
                  value={form.footer_contact_body}
                  onChange={(e) => editor.updateField("footer_contact_body", e.target.value)}
                  onBlur={editor.saveOnBlur}
                />
              </FormField>
            </div>
          </div>

          <FormField label="Copyright line">
            <Input
              value={form.footer_copyright}
              onChange={(e) => editor.updateField("footer_copyright", e.target.value)}
              onBlur={editor.saveOnBlur}
            />
          </FormField>
        </div>
      </SettingsPanel>
    </TabsContent>
  );
}
