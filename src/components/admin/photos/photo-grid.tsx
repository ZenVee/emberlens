import { Eye, EyeOff, Lock, Pencil, Star, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import type { DbPhoto } from "@/lib/media-types";
import { cn } from "@/lib/utils";

export function PhotoStatusBadges({ photo }: { photo: DbPhoto }) {
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
      {photo.public_watermarked && (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
          Watermarked
        </span>
      )}
    </div>
  );
}

export function PhotoRowActions({
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
  onTogglePublicWatermarked,
  published,
  featured,
  publicWatermarked,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
  onTogglePublicWatermarked: () => void;
  published: boolean;
  featured: boolean;
  publicWatermarked: boolean;
}) {
  return (
    <div className="flex justify-end gap-0.5">
      <IconButton onClick={onTogglePublished} title={published ? "Unpublish" : "Publish"}>
        {published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </IconButton>
      <IconButton onClick={onToggleFeatured} title={featured ? "Unfeature" : "Feature"}>
        <Star className={cn("h-3.5 w-3.5", featured && "fill-current text-ember")} />
      </IconButton>
      <IconButton
        onClick={onTogglePublicWatermarked}
        title={publicWatermarked ? "Remove public watermark" : "Watermark on public gallery"}
      >
        <Lock className={cn("h-3.5 w-3.5", publicWatermarked && "text-amber-400")} />
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

export function PhotoGridCard({
  photo,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onTogglePublished,
  onToggleFeatured,
  onTogglePublicWatermarked,
}: {
  photo: DbPhoto;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
  onTogglePublicWatermarked: () => void;
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
            <PhotoStatusBadges photo={photo} />
          </div>
        </div>

        <div className="absolute right-2.5 top-2.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <OverlayAction
            onClick={onTogglePublished}
            title={photo.published ? "Unpublish" : "Publish"}
          >
            {photo.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </OverlayAction>
          <OverlayAction
            onClick={onToggleFeatured}
            title={photo.featured ? "Unfeature" : "Feature"}
          >
            <Star className={cn("h-3.5 w-3.5", photo.featured && "fill-current")} />
          </OverlayAction>
          <OverlayAction
            onClick={onTogglePublicWatermarked}
            title={
              photo.public_watermarked ? "Remove public watermark" : "Watermark on public gallery"
            }
          >
            <Lock className={cn("h-3.5 w-3.5", photo.public_watermarked && "text-amber-300")} />
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
