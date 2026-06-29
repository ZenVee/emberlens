import { Check, Copy, Eye, EyeOff, Lock, Trash2, Upload } from "lucide-react";
import type { ComponentType } from "react";

import { AppSelect } from "@/components/app-select";
import { PhotoUploadModal } from "@/components/photo-upload-modal";
import { SaveStatus } from "@/components/save-status";
import type { ProjectEditorState } from "@/hooks/admin/use-project-editor";
import { NO_PROJECT_CATEGORY } from "@/hooks/admin/use-project-editor";
import type { DbPhoto } from "@/lib/media-types";

type ProjectEditDetailsProps = Pick<
  ProjectEditorState,
  | "project"
  | "setProject"
  | "saveStatus"
  | "saveError"
  | "projectCategoryOptions"
  | "clientLink"
  | "linkCopied"
  | "copyClientLink"
  | "setCategory"
>;

export function ProjectEditDetails({
  project,
  setProject,
  saveStatus,
  saveError,
  projectCategoryOptions,
  clientLink,
  linkCopied,
  copyClientLink,
  setCategory,
}: ProjectEditDetailsProps) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg">Details</h2>
        <SaveStatus status={saveStatus} error={saveError} />
      </div>
      <div className="mt-4 space-y-4">
        <TextField
          label="Title"
          value={project.title}
          onChange={(v) => setProject({ ...project, title: v })}
        />
        <TextField
          label="Client"
          value={project.client ?? ""}
          onChange={(v) => setProject({ ...project, client: v })}
        />
        <label className="block space-y-2 text-sm">
          <span className="text-muted-foreground">Category</span>
          <AppSelect
            value={project.category ?? NO_PROJECT_CATEGORY}
            onValueChange={setCategory}
            options={projectCategoryOptions}
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Shoot date</span>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
            value={project.shoot_date ?? ""}
            onChange={(e) => setProject({ ...project, shoot_date: e.target.value || null })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Description</span>
          <textarea
            rows={4}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
            value={project.description ?? ""}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
          />
        </label>
        <TextField
          label="Download link"
          value={project.download_link ?? ""}
          onChange={(v) => setProject({ ...project, download_link: v || null })}
          placeholder="https://drive.google.com/..."
        />
      </div>

      <div className="mt-6 space-y-3 border-t border-border/60 pt-6">
        <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3">
          <p className="text-sm font-medium">Client link</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this with your client anytime. Unpublished projects are only visible via this
            link.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs">
              {clientLink}
            </code>
            <button
              type="button"
              onClick={() => void copyClientLink()}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
            >
              {linkCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
        <ToggleRow
          label="Published"
          description="Show on the public projects page and homepage"
          checked={project.published}
          onChange={(published) => setProject({ ...project, published })}
          icon={project.published ? Eye : EyeOff}
        />
        <ToggleRow
          label="Client paid"
          description={
            project.client_paid_at
              ? "Synced with linked bookings"
              : "Remove watermarks from the client gallery link"
          }
          checked={Boolean(project.client_paid_at)}
          onChange={(paid) =>
            setProject({
              ...project,
              client_paid_at: paid ? new Date().toISOString() : null,
              public_watermarked: paid ? project.public_watermarked : false,
            })
          }
          icon={Check}
        />
        {project.client_paid_at && (
          <ToggleRow
            label="Watermarks on public page"
            description="Show watermarked images when this project is published"
            checked={project.public_watermarked}
            onChange={(public_watermarked) => setProject({ ...project, public_watermarked })}
            icon={Lock}
          />
        )}
      </div>
    </section>
  );
}

type ProjectEditPhotosProps = Pick<
  ProjectEditorState,
  | "project"
  | "photos"
  | "coverId"
  | "setCoverId"
  | "uploadOpen"
  | "setUploadOpen"
  | "photoCategories"
  | "uploadFn"
  | "handlePhotosUploaded"
  | "setDeleteTarget"
  | "movePhoto"
>;

export function ProjectEditPhotos({
  project,
  photos,
  coverId,
  setCoverId,
  uploadOpen,
  setUploadOpen,
  photoCategories,
  uploadFn,
  handlePhotosUploaded,
  setDeleteTarget,
  movePhoto,
}: ProjectEditPhotosProps) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg">Photos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload images directly to this project gallery.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-ember px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
        >
          <Upload className="h-4 w-4" /> Upload photos
        </button>
      </div>

      <PhotoUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={photoCategories}
        onUpload={(payload) => uploadFn({ ...payload, projectId: project.id })}
        onUploaded={handlePhotosUploaded}
      />

      {photos.length > 0 ? (
        <div className="mt-6 space-y-3">
          {photos.map((photo, index) => (
            <ProjectPhotoRow
              key={photo.id}
              photo={photo}
              orderIndex={index}
              isCover={coverId === photo.id}
              onRemove={() => setDeleteTarget(photo)}
              onSetCover={() => setCoverId(photo.id)}
              onMoveUp={() => movePhoto(photo.id, -1)}
              onMoveDown={() => movePhoto(photo.id, 1)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          No photos yet. Upload images to build this gallery.
        </p>
      )}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${
          checked ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {checked ? "On" : "Off"}
      </button>
    </label>
  );
}

function ProjectPhotoRow({
  photo,
  orderIndex,
  isCover,
  onRemove,
  onSetCover,
  onMoveUp,
  onMoveDown,
}: {
  photo: DbPhoto;
  orderIndex: number;
  isCover: boolean;
  onRemove: () => void;
  onSetCover: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ember/50 bg-ember/5 px-3 py-2">
      <img src={photo.cdn_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{photo.title}</p>
        <p className="text-xs text-muted-foreground">{photo.category}</p>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">#{orderIndex + 1}</span>
        <button
          type="button"
          onClick={onMoveUp}
          className="rounded px-1 text-xs hover:bg-secondary"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          className="rounded px-1 text-xs hover:bg-secondary"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onSetCover}
          className={`rounded-full px-2 py-0.5 text-xs ${isCover ? "bg-ember text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
        >
          Cover
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
          aria-label="Delete photo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
