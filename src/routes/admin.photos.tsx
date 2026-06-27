import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Search, Grid3x3, List, Trash2, Pencil, Star, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { PhotoUploadModal } from "@/components/photo-upload-modal";
import { useAdminPhotos } from "@/lib/admin-queries";
import { PHOTO_CATEGORIES, type DbPhoto, type PhotoCategory } from "@/lib/media-types";
import { deletePhoto, updatePhoto, uploadPhoto } from "@/lib/media";
import { adminPhotosQueryKey } from "@/lib/query-keys";

export const Route = createFileRoute("/admin/photos")({
  head: () => ({ meta: [{ title: "Photos — Ember Lens Studio" }] }),
  component: AdminPhotos,
});

function AdminPhotos() {
  const { data: photos = [], isPending, isError, error: loadError } = useAdminPhotos();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<DbPhoto | null>(null);

  const uploadFn = useServerFn(uploadPhoto);
  const updateFn = useServerFn(updatePhoto);
  const deleteFn = useServerFn(deletePhoto);

  useAdminPageMeta({ title: "Photos", subtitle: `${photos.length} photos in your library` });

  function updatePhotos(updater: (prev: DbPhoto[]) => DbPhoto[]) {
    queryClient.setQueryData(adminPhotosQueryKey, (prev: DbPhoto[] | undefined) => updater(prev ?? []));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return photos;
    return photos.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [photos, query]);

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

  async function handleDelete(photo: DbPhoto) {
    if (!confirm(`Delete "${photo.title}"?`)) return;
    const result = await deleteFn({ data: { id: photo.id } });
    if (result.error) {
      setError(result.error);
      return;
    }
    updatePhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  async function saveEdit() {
    if (!editing) return;
    const result = await updateFn({
      data: { id: editing.id, title: editing.title, category: editing.category },
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    updatePhotos((prev) => prev.map((p) => (p.id === editing.id ? editing : p)));
    setEditing(null);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 sm:max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search photos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`grid h-8 w-8 place-items-center rounded-lg ${view === "grid" ? "bg-gradient-ember text-primary-foreground" : "text-muted-foreground"}`}
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`grid h-8 w-8 place-items-center rounded-lg ${view === "list" ? "bg-gradient-ember text-primary-foreground" : "text-muted-foreground"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-ember px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
        >
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>

      <PhotoUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={(data) => uploadFn({ data })}
        onUploaded={(uploaded) => {
          setError(null);
          updatePhotos((prev) => [...uploaded, ...prev]);
        }}
      />

      {error && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {isError && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError instanceof Error ? loadError.message : "Could not load photos."}
        </p>
      )}

      {isPending ? (
        <AdminLoading variant="grid" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 px-6 py-16 text-center">
          <p className="text-muted-foreground">No photos yet. Upload your first image to get started.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <PhotoGridCard
              key={p.id}
              photo={p}
              onEdit={() => setEditing(p)}
              onDelete={() => void handleDelete(p)}
              onTogglePublished={() => void togglePublished(p)}
              onToggleFeatured={() => void toggleFeatured(p)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border/60 hover:bg-secondary/40">
                  <td className="px-4 py-2.5">
                    <img
                      src={p.cdn_url}
                      alt=""
                      loading="lazy"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-medium">{p.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadges photo={p} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <PhotoActions
                      onEdit={() => setEditing(p)}
                      onDelete={() => void handleDelete(p)}
                      onTogglePublished={() => void togglePublished(p)}
                      onToggleFeatured={() => void toggleFeatured(p)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-xl">Edit photo</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm">
                <span className="text-muted-foreground">Title</span>
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Category</span>
                <select
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value as PhotoCategory })
                  }
                >
                  {PHOTO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                className="rounded-full bg-gradient-ember px-4 py-2 text-sm text-primary-foreground shadow-glow"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatusBadges({ photo }: { photo: DbPhoto }) {
  return (
    <div className="flex flex-wrap gap-1">
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${photo.published ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"}`}
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
}: {
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
}) {
  return (
    <div className="inline-flex gap-1">
      <button
        type="button"
        onClick={onTogglePublished}
        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
        title="Toggle publish"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onToggleFeatured}
        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
        title="Toggle featured"
      >
        <Star className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PhotoGridCard({
  photo,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
}: {
  photo: DbPhoto;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
      <div className="aspect-square overflow-hidden">
        <img
          src={photo.cdn_url}
          alt={photo.title}
          loading="lazy"
          width={400}
          height={400}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{photo.title}</p>
        <p className="text-xs text-muted-foreground">{photo.category}</p>
        <div className="mt-2">
          <StatusBadges photo={photo} />
        </div>
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onTogglePublished}
          className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
          title={photo.published ? "Unpublish" : "Publish"}
        >
          {photo.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onToggleFeatured}
          className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
        >
          <Star className={`h-3.5 w-3.5 ${photo.featured ? "fill-current" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
