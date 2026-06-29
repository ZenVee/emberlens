import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { CreateProjectDialog } from "@/components/admin/projects/create-project-dialog";
import { useAdminPageMeta } from "@/components/use-admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { prefetchAdminProject, useAdminProjects } from "@/lib/admin-queries";
import { categorySelectOptions } from "@/lib/categories";
import { formatShootDate } from "@/lib/media-types";
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useToggleProjectPublishedMutation,
} from "@/lib/mutations/projects";
import { mutationErrorMessage } from "@/lib/mutations/shared";
import type { CreateProjectFormValues } from "@/lib/schemas/project-form";
import { useSiteSettings } from "@/lib/site-settings-queries";

export const Route = createFileRoute("/admin/projects")({
  head: () => ({ meta: [{ title: "Projects — Ember Lens Studio" }] }),
  component: AdminProjects,
});

function AdminProjects() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/admin/projects") return <Outlet />;
  return <AdminProjectsList />;
}

function AdminProjectsList() {
  const settings = useSiteSettings();
  const projectCategoryOptions = categorySelectOptions(settings.project_categories);

  const { data: projects = [], isPending, isError, error: loadError } = useAdminProjects();
  const queryClient = useQueryClient();
  const createMutation = useCreateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();
  const togglePublishedMutation = useToggleProjectPublishedMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const defaultCategory = settings.project_categories[0] ?? "Portrait";

  useAdminPageMeta({
    title: "Projects",
    subtitle: `${projects.length} projects in your portfolio`,
  });

  async function handleCreate(values: CreateProjectFormValues) {
    setError(null);
    try {
      await createMutation.mutateAsync(values);
      setShowCreate(false);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not create project."));
    }
  }

  async function togglePublished(id: string, published: boolean) {
    setError(null);
    try {
      await togglePublishedMutation.mutateAsync({ id, published });
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not update project."));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not delete project."));
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Manage case studies and client deliverables.
        </p>
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
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    to="/admin/projects/$projectId"
                    params={{ projectId: pr.id }}
                    preload="intent"
                    onMouseEnter={() => prefetchAdminProject(queryClient, pr.id)}
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
                    {pr.published ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
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
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
        title="Delete project"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}" and all gallery photos in this project? This cannot be undone.`
            : "Delete this project and its gallery photos? This cannot be undone."
        }
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <CreateProjectDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        defaultCategory={defaultCategory}
        projectCategoryOptions={projectCategoryOptions}
        submitting={createMutation.isPending}
        error={error}
        onSubmit={handleCreate}
      />
    </>
  );
}
