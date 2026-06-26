import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { projects } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/projects")({
  head: () => ({ meta: [{ title: "Projects — Ember Lens Studio" }] }),
  component: AdminProjects,
});

function AdminProjects() {
  return (
    <AdminShell title="Projects" subtitle={`${projects.length} projects in your portfolio`}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Manage your published case studies and shoot folders.</p>
        <button className="inline-flex items-center gap-2 rounded-full bg-gradient-ember px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((pr) => (
          <div key={pr.id} className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-glow">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={pr.cover} alt={pr.title} loading="lazy" width={600} height={450} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-ember">{pr.category}</span>
                <span className="text-muted-foreground">{pr.images.length} photos</span>
              </div>
              <h3 className="mt-3 font-display text-lg">{pr.title}</h3>
              <p className="text-xs text-muted-foreground">{pr.client} · {pr.date}</p>
              <div className="mt-4 flex items-center gap-2">
                <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-background py-2 text-xs hover:bg-secondary">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:border-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
