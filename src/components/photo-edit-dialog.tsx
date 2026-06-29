import { useEffect, useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";

import { AppSelect } from "@/components/app-select";
import { SaveStatus } from "@/components/save-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAutoSave } from "@/hooks/use-auto-save";
import { categorySelectOptions } from "@/lib/categories";
import { GALLERY_ORIENTATION_OPTIONS } from "@/lib/gallery-orientation";
import type { DbPhoto } from "@/lib/media-types";
import { cn } from "@/lib/utils";

type PhotoEditDialogProps = {
  photo: DbPhoto | null;
  categories: readonly string[];
  folders: readonly { id: string; name: string }[];
  onClose: () => void;
  onSave: (photo: DbPhoto) => void | Promise<void>;
};

export function PhotoEditDialog({
  photo,
  categories,
  folders,
  onClose,
  onSave,
}: PhotoEditDialogProps) {
  const [draft, setDraft] = useState<DbPhoto | null>(photo);

  useEffect(() => {
    setDraft(photo);
  }, [photo]);

  const categoryOptions = useMemo(
    () => categorySelectOptions(categories, draft?.category),
    [categories, draft?.category],
  );

  const folderOptions = useMemo(
    () => [
      { value: "__none__", label: "No folder" },
      ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
    ],
    [folders],
  );

  const { status: saveStatus, error: saveError } = useAutoSave(
    draft,
    async (next) => {
      try {
        await onSave(next);
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : "Could not save photo.",
        };
      }
    },
    { enabled: draft !== null },
  );

  function handleOpenChange(open: boolean) {
    if (!open) onClose();
  }

  if (!draft) return null;

  return (
    <Dialog open={photo !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
          <DialogTitle className="font-display text-xl">Edit photo</DialogTitle>
          <DialogDescription>Update metadata and gallery layout.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-secondary">
              {draft.cdn_url ? (
                <img src={draft.cdn_url} alt={draft.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 opacity-40" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={draft.published ? "Published" : "Draft"}
                tone={draft.published ? "success" : "muted"}
              />
              {draft.featured && <StatusPill label="Featured" tone="accent" />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-edit-title">Title</Label>
              <Input
                id="photo-edit-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-edit-category">Category</Label>
              <AppSelect
                value={draft.category}
                onValueChange={(value) => setDraft({ ...draft, category: value })}
                options={categoryOptions}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-edit-folder">Folder</Label>
              <AppSelect
                value={draft.folder_id ?? "__none__"}
                onValueChange={(value) =>
                  setDraft({ ...draft, folder_id: value === "__none__" ? null : value })
                }
                options={folderOptions}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-edit-orientation">Gallery layout</Label>
              <AppSelect
                value={draft.gallery_orientation ?? "portrait"}
                onValueChange={(value) =>
                  setDraft({
                    ...draft,
                    gallery_orientation: value as DbPhoto["gallery_orientation"],
                  })
                }
                options={GALLERY_ORIENTATION_OPTIONS}
              />
              <p className="text-xs text-muted-foreground">
                Portrait tiles are tall; wide images span two columns in the masonry grid.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 px-6 py-4 sm:justify-between">
          <SaveStatus status={saveStatus} error={saveError} />
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "success" | "muted" | "accent" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs",
        tone === "success" && "bg-emerald-500/15 text-emerald-400",
        tone === "muted" && "bg-secondary text-muted-foreground",
        tone === "accent" && "bg-ember/15 text-ember",
      )}
    >
      {label}
    </span>
  );
}
