import { AdminLoading } from "@/components/admin-loading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { DbPhoto } from "@/lib/media-types";
import type { AdminPhotosPageState } from "@/hooks/admin/use-admin-photos";
import {
  PhotoGridCard,
  PhotoRowActions,
  PhotoStatusBadges,
} from "@/components/admin/photos/photo-grid";

type PhotoGalleryProps = Pick<
  AdminPhotosPageState,
  | "isPending"
  | "photos"
  | "filtered"
  | "hasActiveFilters"
  | "clearFilters"
  | "view"
  | "selected"
  | "toggleSelected"
  | "setEditing"
  | "setDeleteTarget"
  | "togglePublished"
  | "toggleFeatured"
>;

export function PhotoGallery({
  isPending,
  photos,
  filtered,
  hasActiveFilters,
  clearFilters,
  view,
  selected,
  toggleSelected,
  setEditing,
  setDeleteTarget,
  togglePublished,
  toggleFeatured,
}: PhotoGalleryProps) {
  if (isPending) {
    return <AdminLoading variant="grid" />;
  }

  if (filtered.length === 0) {
    return (
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
    );
  }

  if (view === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {filtered.map((photo) => (
          <PhotoGridCard
            key={photo.id}
            photo={photo}
            selected={selected.has(photo.id)}
            onSelect={() => toggleSelected(photo.id)}
            onEdit={() => setEditing(photo)}
            onDelete={() => setDeleteTarget(photo)}
            onTogglePublished={() => void togglePublished(photo)}
            onToggleFeatured={() => void toggleFeatured(photo)}
          />
        ))}
      </div>
    );
  }

  return (
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
            {filtered.map((photo) => (
              <PhotoListRow
                key={photo.id}
                photo={photo}
                selected={selected.has(photo.id)}
                onSelect={() => toggleSelected(photo.id)}
                onEdit={() => setEditing(photo)}
                onDelete={() => setDeleteTarget(photo)}
                onTogglePublished={() => void togglePublished(photo)}
                onToggleFeatured={() => void toggleFeatured(photo)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PhotoListRow({
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
    <tr className="border-t border-border/40 transition-colors hover:bg-secondary/30">
      <td className="px-4 py-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label={`Select ${photo.title}`}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={photo.cdn_url}
            alt=""
            loading="lazy"
            width={48}
            height={48}
            className="h-11 w-11 shrink-0 rounded-lg object-cover"
          />
          <span className="font-medium">{photo.title}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{photo.category}</td>
      <td className="px-4 py-3">
        <PhotoStatusBadges photo={photo} />
      </td>
      <td className="px-4 py-3">
        <PhotoRowActions
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePublished={onTogglePublished}
          onToggleFeatured={onToggleFeatured}
          published={photo.published}
          featured={photo.featured}
        />
      </td>
    </tr>
  );
}
