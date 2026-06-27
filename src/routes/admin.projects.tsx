import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAdminProjects } from "@/lib/admin-queries";
import { PHOTO_CATEGORIES, formatShootDate, type PhotoCategory } from "@/lib/media-types";
import { createProject, deleteProject, updateProject } from "@/lib/media";
import { adminProjectsQueryKey } from "@/lib/query-keys";

export const Route = createFileRoute("/admin/projects")({
  head: () => ({ meta: [{ title: "Projects — Ember Lens Studio" }] }),
  component: AdminProjects,
});

function AdminProjects() {
  const { data: projects = [], isPending, isError, error: loadError } = useAdminProjects();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    client: "",
    description: "",
    category: "Portrait" as PhotoCategory,
    shoot_date: "",
  });

  const createFn = useServerFn(createProject);
  const updateFn = useServerFn(updateProject);
  const deleteFn = useServerFn(deleteProject);

  useAdminPageMeta({ title: "Projects", subtitle: `${projects.length} projects in your portfolio` });

  function updateProjects(updater: (prev: typeof projects) => typeof projects) {
    queryClient.setQueryData(adminProjectsQueryKey, (prev: typeof projects | undefined) =>
      updater(prev ?? []),
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const result = await createFn({ data: form });
    setCreating(false);
    if (result.error || !result.project) {
      setError(result.error ?? "Could not create project.");
      return;
    }
    updateProjects((prev) => [
      {
        ...result.project!,
        photoCount: 0,
        coverUrl: null,
        project_photos: [{ count: 0 }],
        cover: null,
      },
      ...prev,
    ]);
    setShowCreate(false);
    setForm({ title: "", client: "", description: "", category: "Portrait", shoot_date: "" });
  }

  async function togglePublished(id: string, published: boolean) {
    const result = await updateFn({ data: { id, published: !published } });
    if (result.error) {
      setError(result.error);
      return;
    }
    updateProjects((prev) => prev.map((p) => (p.id === id ? { ...p, published: !published } : p)));
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
    updateProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Manage case studies and client deliverables.</p>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-ember px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {isError && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError instanceof Error ? loadError.message : "Could not load projects."}
        </p>
      )}

      {isPending ? (
        <AdminLoading variant="cards" />
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 px-6 py-16 text-center">
          <p className="text-muted-foreground">No projects yet. Create one to assign photos.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((pr) => (
            <div
              key={pr.id}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                {pr.coverUrl ? (
                  <img
                    src={pr.coverUrl}
                    alt={pr.title}
                    loading="lazy"
                    width={600}
                    height={450}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No cover yet
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-ember">
                    {pr.category ?? "Uncategorized"}
                  </span>
                  <span className="text-muted-foreground">{pr.photoCount} photos</span>
                </div>
                <h3 className="mt-3 font-display text-lg">{pr.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {pr.client ?? "No client"} · {formatShootDate(pr.shoot_date) || "No date"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${pr.published ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"}`}
                  >
                    {pr.published ? "Published" : "Draft"}
                  </span>
                  {!pr.client_paid_at && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                      Watermarked
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    to="/admin/projects/$projectId"
                    params={{ projectId: pr.id }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-background py-2 text-xs hover:bg-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => void togglePublished(pr.id, pr.published)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary"
                    title={pr.published ? "Unpublish" : "Publish"}
                  >
                    {pr.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: pr.id, title: pr.title })}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Delete project"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This cannot be undone.`
            : "Delete this project? This cannot be undone."
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <h2 className="font-display text-xl">New project</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
              <Field label="Client" value={form.client} onChange={(v) => setForm({ ...form, client: v })} />
              <label className="block text-sm">
                <span className="text-muted-foreground">Category</span>
                <select
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as PhotoCategory })}
                >
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
                  value={form.shoot_date}
                  onChange={(e) => setForm({ ...form, shoot_date: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Description</span>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-full bg-gradient-ember px-4 py-2 text-sm text-primary-foreground shadow-glow disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        required={required}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ember"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
