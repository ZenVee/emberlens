import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Upload,
  Search,
  Grid3x3,
  List,
  Trash2,
  Pencil,
  Star,
  Eye,
  EyeOff,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AppSelect } from "@/components/app-select";
import { PhotoEditDialog } from "@/components/photo-edit-dialog";
import { PhotoUploadModal } from "@/components/photo-upload-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAdminPhotos } from "@/lib/admin-queries";
import { categorySelectOptions } from "@/lib/categories";
import { type DbPhoto, type PhotoCategory } from "@/lib/media-types";
import { bulkDeletePhotos, bulkUpdatePhotos, deletePhoto, updatePhoto, uploadPhoto } from "@/lib/media";
import { adminPhotosQueryKey } from "@/lib/query-keys";
import { useSiteSettings } from "@/lib/site-settings-queries";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "published" | "draft" | "featured";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "featured", label: "Featured" },
];

export const Route = createFileRoute("/admin/photos")({
  head: () => ({ meta: [{ title: "Photos — Ember Lens Studio" }] }),
  component: AdminPhotos,
});

function AdminPhotos() {
  const settings = useSiteSettings();
  const photoCategories = settings.photo_categories;
  const categoryFilterOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...photoCategories.map((c) => ({ value: c, label: c })),
    ],
    [photoCategories],
  );
  const categoryOptions = useMemo(
    () => categorySelectOptions(photoCategories),
    [photoCategories],
  );

  const { data: photos = [], isPending, isError, error: loadError } = useAdminPhotos();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PhotoCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<PhotoCategory>(
    () => photoCategories[0] ?? "Portrait",
  );
  const [bulkWorking, setBulkWorking] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<DbPhoto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DbPhoto | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadFn = useServerFn(uploadPhoto);
  const updateFn = useServerFn(updatePhoto);
  const deleteFn = useServerFn(deletePhoto);
  const bulkUpdateFn = useServerFn(bulkUpdatePhotos);
  const bulkDeleteFn = useServerFn(bulkDeletePhotos);

  const hasActiveFilters =
    query.trim() !== "" || categoryFilter !== "all" || statusFilter !== "all";

  useAdminPageMeta({
    title: "Photos",
    subtitle: "Upload, organize, and publish your gallery.",
  });

  function updatePhotos(updater: (prev: DbPhoto[]) => DbPhoto[]) {
    queryClient.setQueryData(adminPhotosQueryKey, (prev: DbPhoto[] | undefined) => updater(prev ?? []));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return photos.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter === "published" && !p.published) return false;
      if (statusFilter === "draft" && p.published) return false;
      if (statusFilter === "featured" && !p.featured) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [photos, query, categoryFilter, statusFilter]);

  const filteredIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someFilteredSelected = filtered.some((p) => selected.has(p.id));
  const selectedCount = selected.size;

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id);
      } else {
        for (const id of filteredIds) next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  }

  async function togglePublished(photo: DbPhoto) {
    const result = await updateFn({ data: { id: photo.id, published: !photo.published } });
    if (result.error) {
      setError(result.error);
      return;
    }
    updatePhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, published: !p.published } : p)),
    );
  }

  async function toggleFeatured(photo: DbPhoto) {
    const result = await updateFn({ data: { id: photo.id, featured: !photo.featured } });
    if (result.error) {
      setError(result.error);
      return;
    }
    updatePhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, featured: !p.featured } : p)),
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    const result = await deleteFn({ data: { id: deleteTarget.id } });
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    updatePhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });
    setDeleteTarget(null);
  }

  async function confirmBulkDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setDeleting(true);
    setError(null);
    const result = await bulkDeleteFn({ data: { ids } });
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    updatePhotos((prev) => prev.filter((p) => !selected.has(p.id)));
    clearSelection();
    setBulkDeleteOpen(false);
  }

  async function runBulkUpdate(patch: {
    category?: PhotoCategory;
    published?: boolean;
    featured?: boolean;
  }) {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkWorking(true);
    setError(null);
    const result = await bulkUpdateFn({ data: { ids, ...patch } });
    setBulkWorking(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    updatePhotos((prev) =>
      prev.map((p) => (selected.has(p.id) ? { ...p, ...patch } : p)),
    );
  }

  async function saveEdit(updated: DbPhoto) {
    const result = await updateFn({
      data: { id: updated.id, title: updated.title, category: updated.category },
    });
    if (result.error) {
      throw new Error(result.error);
    }
    updatePhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {photos.length} photo{photos.length === 1 ? "" : "s"}
          {filtered.length !== photos.length && ` · ${filtered.length} shown`}
        </p>
        <Button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="rounded-full bg-gradient-ember shadow-glow hover:opacity-90"
        >
          <Upload /> Upload photos
        </Button>
      </div>

      <section className="rounded-xl border border-border/60 bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 border-border/60 bg-background pl-9"
              placeholder="Search by title or category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === value
                      ? "bg-gradient-ember text-primary-foreground shadow-glow"
                      : "bg-secondary/80 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <AppSelect
              className="w-[11rem]"
              value={categoryFilter}
              onValueChange={(v) =>
                setCategoryFilter(v === "all" ? "all" : (v as PhotoCategory))
              }
              options={categoryFilterOptions}
            />

            <div className="flex rounded-lg border border-border/60 bg-background p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors",
                  view === "grid"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors",
                  view === "list"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox
              checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
              onCheckedChange={() => toggleSelectAllFiltered()}
              disabled={filtered.length === 0}
            />
            <span className="text-muted-foreground">
              Select {filtered.length === photos.length ? "all" : "filtered"}
            </span>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </section>

      {(error || isError) && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error ?? (loadError instanceof Error ? loadError.message : "Could not load photos.")}
        </p>
      )}

      {isPending ? (
        <AdminLoading variant="grid" />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-20 text-center">
          <p className="text-muted-foreground">
            {photos.length === 0
              ? "No photos yet. Upload your first image to get started."
              : "No photos match your filters."}
          </p>
          {photos.length > 0 && hasActiveFilters && (
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <PhotoGridCard
              key={p.id}
              photo={p}
              selected={selected.has(p.id)}
              onSelect={() => toggleSelected(p.id)}
              onEdit={() => setEditing(p)}
              onDelete={() => setDeleteTarget(p)}
              onTogglePublished={() => void togglePublished(p)}
              onToggleFeatured={() => void toggleFeatured(p)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border/60 bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-12 px-4 py-3" />
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="w-36 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border/40 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={() => toggleSelected(p.id)}
                        aria-label={`Select ${p.title}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.cdn_url}
                          alt=""
                          loading="lazy"
                          width={48}
                          height={48}
                          className="h-11 w-11 shrink-0 rounded-lg object-cover"
                        />
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3">
                      <StatusBadges photo={p} />
                    </td>
                    <td className="px-4 py-3">
                      <PhotoActions
                        onEdit={() => setEditing(p)}
                        onDelete={() => setDeleteTarget(p)}
                        onTogglePublished={() => void togglePublished(p)}
                        onToggleFeatured={() => void toggleFeatured(p)}
                        published={p.published}
                        featured={p.featured}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-card backdrop-blur-sm">
          <span className="mr-1 text-sm font-medium">{selectedCount} selected</span>
          <BulkButton
            disabled={bulkWorking}
            onClick={() => void runBulkUpdate({ published: true })}
            icon={Eye}
            label="Publish"
          />
          <BulkButton
            disabled={bulkWorking}
            onClick={() => void runBulkUpdate({ published: false })}
            icon={EyeOff}
            label="Unpublish"
          />
          <BulkButton
            disabled={bulkWorking}
            onClick={() => void runBulkUpdate({ featured: true })}
            icon={Star}
            label="Feature"
          />
          <BulkButton
            disabled={bulkWorking}
            onClick={() => void runBulkUpdate({ featured: false })}
            icon={Star}
            label="Unfeature"
          />
          <div className="hidden h-5 w-px bg-border sm:block" />
          <AppSelect
            size="sm"
            className="w-[8.5rem]"
            value={bulkCategory}
            onValueChange={(v) => setBulkCategory(v as PhotoCategory)}
            options={categoryOptions}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bulkWorking}
            onClick={() => void runBulkUpdate({ category: bulkCategory })}
          >
            Set category
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bulkWorking}
            className="text-destructive hover:text-destructive"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 /> Delete
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={clearSelection}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <PhotoUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={photoCategories}
        onUpload={(data) => uploadFn({ data })}
        onUploaded={(uploaded) => {
          setError(null);
          updatePhotos((prev) => [...uploaded, ...prev]);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Delete photo"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This cannot be undone.`
            : "Delete this photo? This cannot be undone."
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleting) setBulkDeleteOpen(false);
        }}
        title="Delete selected photos"
        description={`Delete ${selectedCount} photo${selectedCount === 1 ? "" : "s"}? This cannot be undone.`}
        confirmLabel="Delete all"
        destructive
        loading={deleting}
        onConfirm={confirmBulkDelete}
      />

      <PhotoEditDialog
        photo={editing}
        categories={photoCategories}
        onClose={() => setEditing(null)}
        onSave={(updated) => saveEdit(updated)}
      />
    </div>
  );
}

function BulkButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onClick}>
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

function StatusBadges({ photo }: { photo: DbPhoto }) {
  return (
    <div className="flex flex-wrap gap-1">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs",
          photo.published
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-secondary text-muted-foreground",
        )}
      >
        {photo.published ? "Published" : "Draft"}
      </span>
      {photo.featured && (
        <span className="rounded-full bg-ember/15 px-2 py-0.5 text-xs text-ember">Featured</span>
      )}
    </div>
  );
}

function PhotoActions({
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
  published,
  featured,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
  published: boolean;
  featured: boolean;
}) {
  return (
    <div className="flex justify-end gap-0.5">
      <IconButton onClick={onTogglePublished} title={published ? "Unpublish" : "Publish"}>
        {published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </IconButton>
      <IconButton onClick={onToggleFeatured} title={featured ? "Unfeature" : "Feature"}>
        <Star className={cn("h-3.5 w-3.5", featured && "fill-current text-ember")} />
      </IconButton>
      <IconButton onClick={onEdit} title="Edit">
        <Pencil className="h-3.5 w-3.5" />
      </IconButton>
      <IconButton onClick={onDelete} title="Delete" destructive>
        <Trash2 className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  destructive,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary",
        destructive && "hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}

function PhotoGridCard({
  photo,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
}: {
  photo: DbPhoto;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card shadow-card transition-shadow hover:shadow-glow",
        selected ? "border-ember ring-1 ring-ember/40" : "border-border/60",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={photo.cdn_url}
          alt={photo.title}
          loading="lazy"
          width={400}
          height={400}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        <div className="absolute left-2.5 top-2.5 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="border-white/60 bg-black/40 data-[state=checked]:border-ember data-[state=checked]:bg-ember"
            aria-label={`Select ${photo.title}`}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-3">
          <p className="truncate font-medium text-white">{photo.title}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-xs text-white/70">{photo.category}</span>
            <StatusBadges photo={photo} />
          </div>
        </div>

        <div className="absolute right-2.5 top-2.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <OverlayAction onClick={onTogglePublished} title={photo.published ? "Unpublish" : "Publish"}>
            {photo.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </OverlayAction>
          <OverlayAction onClick={onToggleFeatured} title={photo.featured ? "Unfeature" : "Feature"}>
            <Star className={cn("h-3.5 w-3.5", photo.featured && "fill-current")} />
          </OverlayAction>
          <OverlayAction onClick={onEdit} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </OverlayAction>
          <OverlayAction onClick={onDelete} title="Delete" destructive>
            <Trash2 className="h-3.5 w-3.5" />
          </OverlayAction>
        </div>
      </div>
    </article>
  );
}

function OverlayAction({
  children,
  onClick,
  title,
  destructive,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75",
        destructive && "hover:bg-destructive",
      )}
    >
      {children}
    </button>
  );
}
