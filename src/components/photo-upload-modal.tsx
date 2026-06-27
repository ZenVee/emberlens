import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PHOTO_CATEGORIES, type DbPhoto, type PhotoCategory } from "@/lib/media-types";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  category: PhotoCategory;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type UploadPhotoPayload = {
  fileBase64: string;
  mimeType: string;
  filename: string;
  title: string;
  category: PhotoCategory;
};

type PhotoUploadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (payload: UploadPhotoPayload) => Promise<{ error: string | null; photo: DbPhoto | null }>;
  onUploaded: (photos: DbPhoto[]) => void;
};

function titleFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
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

export function PhotoUploadModal({ open, onOpenChange, onUpload, onUploaded }: PhotoUploadModalProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<PhotoCategory>("Portrait");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<UploadItem[]>([]);

  itemsRef.current = items;

  const revokeAll = useCallback((list: UploadItem[]) => {
    for (const item of list) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      revokeAll(itemsRef.current);
      setItems([]);
      setDragging(false);
      setUploading(false);
    }
  }, [open, revokeAll]);

  function addFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const next: UploadItem[] = imageFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      title: titleFromFilename(file.name),
      category: defaultCategory,
      status: "pending",
    }));

    setItems((prev) => [...prev, ...next]);
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((entry) => entry.id !== id);
    });
  }

  function updateItem(id: string, patch: Partial<Pick<UploadItem, "title" | "category">>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleUploadAll() {
    const pending = items.filter((item) => item.status === "pending" || item.status === "error");
    if (pending.length === 0) return;

    setUploading(true);
    const uploaded: DbPhoto[] = [];

    for (const item of pending) {
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, status: "uploading", error: undefined } : entry,
        ),
      );

      try {
        const base64 = await fileToBase64(item.file);
        const result = await onUpload({
          fileBase64: base64,
          mimeType: item.file.type || "image/jpeg",
          filename: item.file.name,
          title: item.title.trim() || titleFromFilename(item.file.name),
          category: item.category,
        });

        if (result.error || !result.photo) {
          setItems((prev) =>
            prev.map((entry) =>
              entry.id === item.id
                ? { ...entry, status: "error", error: result.error ?? "Upload failed." }
                : entry,
            ),
          );
          continue;
        }

        uploaded.push(result.photo);
        setItems((prev) =>
          prev.map((entry) => (entry.id === item.id ? { ...entry, status: "done" } : entry)),
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "error",
                  error: err instanceof Error ? err.message : "Upload failed.",
                }
              : entry,
          ),
        );
      }
    }

    setUploading(false);

    if (uploaded.length > 0) {
      onUploaded(uploaded);
    }

    if (uploaded.length === pending.length) {
      onOpenChange(false);
    }
  }

  const pendingCount = items.filter((item) => item.status === "pending" || item.status === "error").length;
  const doneCount = items.filter((item) => item.status === "done").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-card sm:max-w-2xl">
        <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
          <DialogTitle className="font-display text-xl">Upload photos</DialogTitle>
          <DialogDescription>Drag and drop images, name each one, then upload.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragging
                ? "border-ember bg-ember/10"
                : "border-border/60 bg-background/50 hover:border-ember/50 hover:bg-secondary/40"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Drop images here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP, GIF — up to 15 MB each</p>
          </div>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Default category for new images</span>
            <select
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value as PhotoCategory)}
            >
              {PHOTO_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 rounded-xl border p-3 ${
                    item.status === "done"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : item.status === "error"
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-border/60 bg-background/50"
                  }`}
                >
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember disabled:opacity-60"
                      value={item.title}
                      disabled={item.status === "uploading" || item.status === "done"}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      placeholder="Photo title"
                    />
                    <select
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember disabled:opacity-60"
                      value={item.category}
                      disabled={item.status === "uploading" || item.status === "done"}
                      onChange={(e) => updateItem(item.id, { category: e.target.value as PhotoCategory })}
                    >
                      {PHOTO_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {item.status === "uploading" && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                      </p>
                    )}
                    {item.status === "done" && (
                      <p className="text-xs text-emerald-400">Uploaded</p>
                    )}
                    {item.status === "error" && (
                      <p className="text-xs text-destructive">{item.error}</p>
                    )}
                  </div>
                  {item.status !== "uploading" && item.status !== "done" && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {items.length === 0
              ? "No images selected"
              : doneCount > 0
                ? `${doneCount} uploaded${pendingCount > 0 ? `, ${pendingCount} remaining` : ""}`
                : `${items.length} image${items.length === 1 ? "" : "s"} ready`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={uploading || pendingCount === 0}
              onClick={() => void handleUploadAll()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-ember px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Upload {pendingCount > 0 ? pendingCount : ""}{" "}
                  {pendingCount === 1 ? "photo" : "photos"}
                </>
              )}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
