import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { useAdminPhotos, useAdminProject } from "@/lib/admin-queries";
import { PHOTO_CATEGORIES, type DbPhoto, type DbProject, type PhotoCategory } from "@/lib/media-types";
import { setProjectPhotos, updateProject } from "@/lib/media";

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
  const { data: libraryPhotos = [], isPending: libraryPending } = useAdminPhotos();

  const [project, setProject] = useState<DbProject | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coverId, setCoverId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const updateFn = useServerFn(updateProject);
  const setPhotosFn = useServerFn(setProjectPhotos);

  useEffect(() => {
    if (!data || initialized) return;
    setProject(data.project);
    setSelectedIds(data.assignedPhotos.map((item) => item.photo.id));
    setCoverId(data.project.cover_photo_id ?? "");
    setInitialized(true);
  }, [data, initialized]);

  useEffect(() => {
    setInitialized(false);
    setProject(null);
    setSelectedIds([]);
    setCoverId("");
  }, [projectId]);

  useAdminPageMeta({
    title: project?.title ?? "Edit project",
    subtitle: "Edit project details and photo set",
  });

  if (!isPending && (isError || data === null)) {
    throw notFound();
  }

  if (isPending || !project || libraryPending) {
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

  async function saveAll() {
    setSaving(true);
    setError(null);
    setMessage(null);

    const updateResult = await updateFn({
      data: {
        id: project.id,
        title: project.title,
        client: project.client ?? "",
        description: project.description ?? "",
        category: project.category,
        shoot_date: project.shoot_date,
        cover_photo_id: coverId || null,
        published: project.published,
        client_paid: Boolean(project.client_paid_at),
      },
    });

    if (updateResult.error) {
      setSaving(false);
      setError(updateResult.error);
      return;
    }

    const photosResult = await setPhotosFn({
      data: { projectId: project.id, photoIds: selectedIds },
    });

    setSaving(false);
    if (photosResult.error) {
      setError(photosResult.error);
      return;
    }

    setMessage("Project saved.");
  }

  function togglePhoto(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((pid) => pid !== id);
        if (coverId === id) setCoverId(next[0] ?? "");
        return next;
      }
      return [...prev, id];
    });
  }

  function movePhoto(id: string, direction: -1 | 1) {
    setSelectedIds((prev) => {
      const index = prev.indexOf(id);
      if (index < 0) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <>
      <Link
        to="/admin/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      {error && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {message}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <h2 className="font-display text-lg">Details</h2>
          <div className="mt-4 space-y-4">
            <TextField label="Title" value={project.title} onChange={(v) => setProject({ ...project, title: v })} />
            <TextField
              label="Client"
              value={project.client ?? ""}
              onChange={(v) => setProject({ ...project, client: v })}
            />
            <label className="block text-sm">
              <span className="text-muted-foreground">Category</span>
              <select
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
                value={project.category ?? ""}
                onChange={(e) =>
                  setProject({
                    ...project,
                    category: (e.target.value || null) as PhotoCategory | null,
                  })
                }
              >
                <option value="">None</option>
                {PHOTO_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
          </div>

          <div className="mt-6 space-y-3 border-t border-border/60 pt-6">
            <ToggleRow
              label="Published"
              description="Visible on the public site"
              checked={project.published}
              onChange={(published) => setProject({ ...project, published })}
              icon={project.published ? Eye : EyeOff}
            />
            <ToggleRow
              label="Client paid"
              description="When off, project pages show watermarked images"
              checked={Boolean(project.client_paid_at)}
              onChange={(paid) =>
                setProject({
                  ...project,
                  client_paid_at: paid ? new Date().toISOString() : null,
                })
              }
              icon={Check}
            />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void saveAll()}
            className="mt-6 w-full rounded-full bg-gradient-ember px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save project"}
          </button>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <h2 className="font-display text-lg">Photos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select images from your library. Order controls the project gallery layout.
          </p>

          {libraryPhotos.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Upload photos in the{" "}
              <Link to="/admin/photos" className="text-ember hover:underline">
                photo library
              </Link>{" "}
              first.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {libraryPhotos.map((photo) => {
                const selected = selectedIds.includes(photo.id);
                const orderIndex = selectedIds.indexOf(photo.id);
                return (
                  <PhotoPickerRow
                    key={photo.id}
                    photo={photo}
                    selected={selected}
                    orderIndex={orderIndex}
                    isCover={coverId === photo.id}
                    onToggle={() => togglePhoto(photo.id)}
                    onSetCover={() => setCoverId(photo.id)}
                    onMoveUp={() => movePhoto(photo.id, -1)}
                    onMoveDown={() => movePhoto(photo.id, 1)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
        value={value}
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

function PhotoPickerRow({
  photo,
  selected,
  orderIndex,
  isCover,
  onToggle,
  onSetCover,
  onMoveUp,
  onMoveDown,
}: {
  photo: DbPhoto;
  selected: boolean;
  orderIndex: number;
  isCover: boolean;
  onToggle: () => void;
  onSetCover: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${selected ? "border-ember/50 bg-ember/5" : "border-border/60"}`}
    >
      <input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 accent-ember" />
      <img src={photo.cdn_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{photo.title}</p>
        <p className="text-xs text-muted-foreground">{photo.category}</p>
      </div>
      {selected && (
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
        </div>
      )}
    </div>
  );
}
