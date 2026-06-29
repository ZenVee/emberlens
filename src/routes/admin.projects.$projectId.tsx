import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import {
  ProjectEditDetails,
  ProjectEditPhotos,
} from "@/components/admin/projects/project-edit-sections";
import { useAdminPageMeta } from "@/components/use-admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAdminProject } from "@/lib/admin-queries";
import type { AdminProjectData } from "@/lib/project-cache";
import { useProjectEditor } from "@/hooks/admin/use-project-editor";

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
  const editor = useProjectEditor(initial);

  return (
    <>
      <Link
        to="/admin/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      {(editor.error || editor.saveError) && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {editor.error ?? editor.saveError}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <ProjectEditDetails {...editor} />
        <ProjectEditPhotos {...editor} />
      </div>

      <ConfirmDialog
        open={editor.deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !editor.deleting) editor.setDeleteTarget(null);
        }}
        title="Delete photo"
        description={
          editor.deleteTarget
            ? `Permanently delete "${editor.deleteTarget.title}"? This removes it from the library and cannot be undone.`
            : "Permanently delete this photo?"
        }
        confirmLabel="Delete"
        destructive
        loading={editor.deleting}
        onConfirm={editor.confirmDeletePhoto}
      />
    </>
  );
}
