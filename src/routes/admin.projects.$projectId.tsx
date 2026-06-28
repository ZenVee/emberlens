import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Copy, Eye, EyeOff, Lock, Trash2, Upload } from "lucide-react";
import { useCallback, useMemo, useRef, useState, type ComponentType } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { AppSelect } from "@/components/app-select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PhotoUploadModal } from "@/components/photo-upload-modal";
import { SaveStatus } from "@/components/save-status";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useAdminProject } from "@/lib/admin-queries";
import { categorySelectOptions } from "@/lib/categories";
import { type DbPhoto, type DbProject, type PhotoCategory } from "@/lib/media-types";
import { deletePhoto, setProjectPhotos, updateProject, uploadPhoto } from "@/lib/media";
import {
  adminPhotosQueryKey,
  adminBookingsQueryKey,
  adminBookingQueryKey,
  adminProjectQueryKey,
  adminProjectsQueryKey,
  adminProjectPhotoGroupsQueryKey,
} from "@/lib/query-keys";
import type { DbBooking } from "@/lib/bookings-types";
import { useSiteSettings } from "@/lib/site-settings-queries";

const NO_CATEGORY = "__none__";

type AdminProjectData = {
  project: DbProject;
  assignedPhotos: { sort_order: number; photo: DbPhoto }[];
};

type ProjectSaveState = {
  project: DbProject;
  coverId: string;
  photoIds: string[];
};

export const Route = createFileRoute("/admin/projects/$projectId")({
  head: () => ({ meta: [{ title: "Edit Project — Ember Lens Studio" }] }),
  component: AdminProjectEdit,
  notFoundComponent: ProjectNotFound,
});

function ProjectNotFound() {
  useAdminPageMeta({ title: "Project not found" });
  return (
    <Link to="/admin/projects" className="text-sm text-ember hover:underline">
      Back to projects
    </Link>
  );
}

function AdminProjectEdit() {
  const { projectId } = useParams({ from: "/admin/projects/$projectId" });
  const { data, isPending, isError } = useAdminProject(projectId);

  useAdminPageMeta({
    title: data?.project.title ?? "Edit project",
    subtitle: "Edit project details and photo set",
  });

  if (!isPending && (isError || data === null)) {
    throw notFound();
  }

  if (isPending || !data || data.project.id !== projectId) {
    return (
      <>
        <Link
          to="/admin/projects"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <AdminLoading variant="form" />
      </>
    );
  }

  return <ProjectEditForm key={projectId} initial={data} />;
}

function ProjectEditForm({ initial }: { initial: AdminProjectData }) {
  const settings = useSiteSettings();
  const projectCategoryOptions = [
    { value: NO_CATEGORY, label: "None" },
    ...categorySelectOptions(settings.project_categories, initial.project.category),
  ];

  const queryClient = useQueryClient();
  const [project, setProject] = useState(initial.project);
  const [photos, setPhotos] = useState<DbPhoto[]>(() =>
    initial.assignedPhotos.map((item) => item.photo),
  );
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const [coverId, setCoverId] = useState(initial.project.cover_photo_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateFn = useServerFn(updateProject);
  const setPhotosFn = useServerFn(setProjectPhotos);
  const uploadFn = useServerFn(uploadPhoto);
  const deleteFn = useServerFn(deletePhoto);

  const saveState = useMemo<ProjectSaveState>(
    () => ({
      project,
      coverId,
      photoIds: photos.map((photo) => photo.id),
    }),
    [project, coverId, photos],
  );

  const syncProjectCaches = useCallback(
    (state: ProjectSaveState, nextPhotos: DbPhoto[]) => {
      queryClient.setQueryData(adminProjectQueryKey(project.id), (prev: AdminProjectData | undefined) => {
        if (!prev) return prev;
        return {
          project: {
            ...state.project,
            cover_photo_id: state.coverId || null,
          },
          assignedPhotos: state.photoIds.map((id, sort_order) => {
            const photo = nextPhotos.find((item) => item.id === id);
            return photo ? { sort_order, photo } : null;
          }).filter((item): item is { sort_order: number; photo: DbPhoto } => item !== null),
        };
      });

      queryClient.setQueryData(adminProjectsQueryKey, (prev) =>
        prev?.map((item) =>
          item.id === project.id
            ? {
                ...item,
                title: state.project.title,
                client: state.project.client,
                category: state.project.category,
                shoot_date: state.project.shoot_date,
                published: state.project.published,
                client_paid_at: state.project.client_paid_at,
                public_watermarked: state.project.public_watermarked,
                coverUrl: nextPhotos.find((photo) => photo.id === state.coverId)?.cdn_url ?? item.coverUrl,
                photoCount: nextPhotos.length,
              }
            : item,
        ),
      );
    },
    [project.id, queryClient],
  );

  const persistProject = useCallback(
    async (state: ProjectSaveState) => {
      const updateResult = await updateFn({
        data: {
          id: state.project.id,
          title: state.project.title,
          client: state.project.client ?? "",
          description: state.project.description ?? "",
          category: state.project.category,
          shoot_date: state.project.shoot_date,
          download_link: state.project.download_link,
          cover_photo_id: state.coverId || null,
          published: state.project.published,
          client_paid: Boolean(state.project.client_paid_at),
          public_watermarked: state.project.public_watermarked,
        },
      });

      if (updateResult.error) {
        return { ok: false as const, error: updateResult.error };
      }

      const photosResult = await setPhotosFn({
        data: { projectId: state.project.id, photoIds: state.photoIds },
      });

      if (photosResult.error) {
        return { ok: false as const, error: photosResult.error };
      }

      queryClient.setQueryData(adminBookingsQueryKey, (prev: DbBooking[] | undefined) => {
        const next =
          prev?.map((booking) =>
            booking.project_id === state.project.id
              ? { ...booking, client_paid_at: state.project.client_paid_at }
              : booking,
          ) ?? prev;
        if (next) {
          for (const booking of next) {
            if (booking.project_id === state.project.id) {
              queryClient.setQueryData(adminBookingQueryKey(booking.id), booking);
            }
          }
        }
        return next;
      });

      syncProjectCaches(
        state,
        state.photoIds
          .map((id) => photosRef.current.find((photo) => photo.id === id))
          .filter((photo): photo is DbPhoto => photo !== undefined),
      );
      void queryClient.invalidateQueries({ queryKey: adminProjectPhotoGroupsQueryKey });
      return { ok: true as const };
    },
    [project.id, setPhotosFn, syncProjectCaches, updateFn, queryClient],
  );

  const { status: saveStatus, error: saveError } = useAutoSave(saveState, persistProject);

  async function confirmDeletePhoto() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);

    const result = await deleteFn({ data: { id: deleteTarget.id } });
    setDeleting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const deletedId = deleteTarget.id;
    setPhotos((prev) => {
      const next = prev.filter((photo) => photo.id !== deletedId);
      if (coverId === deletedId) setCoverId(next[0]?.id ?? "");
      return next;
    });
    queryClient.setQueryData(adminPhotosQueryKey, (prev: DbPhoto[] | undefined) =>
      (prev ?? []).filter((photo) => photo.id !== deletedId),
    );
    void queryClient.invalidateQueries({ queryKey: adminProjectPhotoGroupsQueryKey });
    setDeleteTarget(null);
  }

  function movePhoto(id: string, direction: -1 | 1) {
    setPhotos((prev) => {
      const index = prev.findIndex((photo) => photo.id === id);
      if (index < 0) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const clientLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/projects/${project.slug}`
      : `/projects/${project.slug}`;

  async function copyClientLink() {
    try {
      await navigator.clipboard.writeText(clientLink);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setError("Could not copy link.");
    }
  }

  function handlePhotosUploaded(uploaded: DbPhoto[]) {
    setError(null);
    queryClient.setQueryData(adminPhotosQueryKey, (prev: DbPhoto[] | undefined) => [
      ...uploaded,
      ...(prev ?? []),
    ]);
    setPhotos((prev) => [...prev, ...uploaded]);
    if (!coverId && uploaded[0]) setCoverId(uploaded[0].id);
    void queryClient.invalidateQueries({ queryKey: adminProjectPhotoGroupsQueryKey });
  }

  return (
    <>
      <Link
        to="/admin/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      {(error || saveError) && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error ?? saveError}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg">Details</h2>
            <SaveStatus status={saveStatus} error={saveError} />
          </div>
          <div className="mt-4 space-y-4">
            <TextField label="Title" value={project.title} onChange={(v) => setProject({ ...project, title: v })} />
            <TextField
              label="Client"
              value={project.client ?? ""}
              onChange={(v) => setProject({ ...project, client: v })}
            />
            <label className="block space-y-2 text-sm">
              <span className="text-muted-foreground">Category</span>
              <AppSelect
                value={project.category ?? NO_CATEGORY}
                onValueChange={(v) =>
                  setProject({
                    ...project,
                    category: v === NO_CATEGORY ? null : (v as PhotoCategory),
                  })
                }
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
                Share this with your client anytime. Unpublished projects are only visible via this link.
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
            categories={settings.photo_categories}
            onUpload={(payload) => uploadFn({ data: { ...payload, projectId: project.id } })}
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
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Delete photo"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}"? This removes it from the library and cannot be undone.`
            : "Permanently delete this photo?"
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDeletePhoto}
      />
    </>
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
        <button type="button" onClick={onMoveUp} className="rounded px-1 text-xs hover:bg-secondary">
          ↑
        </button>
        <button type="button" onClick={onMoveDown} className="rounded px-1 text-xs hover:bg-secondary">
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
