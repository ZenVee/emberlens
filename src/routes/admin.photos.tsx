import { createFileRoute } from "@tanstack/react-router";
import { Upload, Search, Grid3x3, List, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { photos } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/photos")({
  head: () => ({ meta: [{ title: "Photos — Ember Lens Studio" }] }),
  component: AdminPhotos,
});

function AdminPhotos() {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <AdminShell title="Photos" subtitle={`${photos.length} photos in your library`}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 sm:max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search photos…" />
        </div>
        <div className="flex rounded-xl border border-border bg-card p-1">
          <button onClick={() => setView("grid")} className={`grid h-8 w-8 place-items-center rounded-lg ${view === "grid" ? "bg-gradient-ember text-primary-foreground" : "text-muted-foreground"}`}>
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button onClick={() => setView("list")} className={`grid h-8 w-8 place-items-center rounded-lg ${view === "list" ? "bg-gradient-ember text-primary-foreground" : "text-muted-foreground"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-gradient-ember px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow">
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
              <div className="aspect-square overflow-hidden">
                <img src={p.src} alt={p.title} loading="lazy" width={400} height={400} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
              </div>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"><Pencil className="h-3.5 w-3.5" /></button>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {photos.map((p) => (
                <tr key={p.id} className="border-t border-border/60 hover:bg-secondary/40">
                  <td className="px-4 py-2.5"><img src={p.src} alt="" loading="lazy" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" /></td>
                  <td className="px-4 py-2.5 font-medium">{p.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.id}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
