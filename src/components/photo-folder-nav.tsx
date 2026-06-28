import { Folder, FolderKanban, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { DbPhotoFolder } from "@/lib/media-types";
import {
  projectFolderFilter,
  type FolderFilter,
} from "@/lib/photo-folder-utils";
import { cn } from "@/lib/utils";

export type { FolderFilter } from "@/lib/photo-folder-utils";

type ProjectFolderItem = {
  projectId: string;
  title: string;
  count: number;
};

type PhotoFolderNavProps = {
  folders: DbPhotoFolder[];
  projectFolders: ProjectFolderItem[];
  active: FolderFilter;
  counts: { all: number; unfiled: number; byFolder: Record<string, number> };
  onSelect: (filter: FolderFilter) => void;
  onCreate: (name: string) => Promise<string | null>;
  onRename: (id: string, name: string) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
};

export function PhotoFolderNav({
  folders,
  projectFolders,
  active,
  counts,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: PhotoFolderNavProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DbPhotoFolder | null>(null);
  const [name, setName] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setName("");
    setError(null);
    setCreateOpen(true);
  }

  function openRename(folder: DbPhotoFolder) {
    setRenameTarget(folder);
    setName(folder.name);
    setError(null);
  }

  async function submitCreate() {
    setWorking(true);
    setError(null);
    const err = await onCreate(name);
    setWorking(false);
    if (err) {
      setError(err);
      return;
    }
    setCreateOpen(false);
  }

  async function submitRename() {
    if (!renameTarget) return;
    setWorking(true);
    setError(null);
    const err = await onRename(renameTarget.id, name);
    setWorking(false);
    if (err) {
      setError(err);
      return;
    }
    setRenameTarget(null);
  }

  async function handleDelete(folder: DbPhotoFolder) {
    if (!window.confirm(`Delete folder "${folder.name}"? Photos will stay in your library.`)) return;
    const err = await onDelete(folder.id);
    if (err) setError(err);
  }

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card p-3 shadow-card">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Folders</p>
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>
        <div className="space-y-0.5">
          <FolderRow
            label="All photos"
            count={counts.all}
            active={active === "all"}
            onClick={() => onSelect("all")}
            icon={FolderOpen}
          />
          <FolderRow
            label="Unfiled"
            count={counts.unfiled}
            active={active === "unfiled"}
            onClick={() => onSelect("unfiled")}
            icon={Folder}
          />
          {folders.map((folder) => (
            <div key={folder.id} className="group flex items-center gap-0.5">
              <FolderRow
                label={folder.name}
                count={counts.byFolder[folder.id] ?? 0}
                active={active === folder.id}
                onClick={() => onSelect(folder.id)}
                icon={Folder}
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => openRename(folder)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                title="Rename folder"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(folder)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                title="Delete folder"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {projectFolders.length > 0 && (
          <div className="mt-4 border-t border-border/60 pt-3">
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-blush">Projects</p>
            <div className="space-y-0.5">
              {projectFolders.map((project) => (
                <ProjectFolderRow
                  key={project.projectId}
                  label={project.title}
                  count={project.count}
                  active={active === projectFolderFilter(project.projectId)}
                  onClick={() => onSelect(projectFolderFilter(project.projectId))}
                  projectId={project.projectId}
                />
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-2 px-1 text-xs text-destructive">{error}</p>}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => e.key === "Enter" && void submitCreate()}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={working} onClick={() => void submitCreate()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submitRename()}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={working} onClick={() => void submitRename()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FolderRow({
  label,
  count,
  active,
  onClick,
  icon: Icon,
  className,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: typeof Folder;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        active
          ? "bg-ember/15 text-ember"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs tabular-nums opacity-70">{count}</span>
    </button>
  );
}

function ProjectFolderRow({
  label,
  count,
  active,
  onClick,
  projectId,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  projectId: string;
}) {
  return (
    <div className="group flex items-center gap-0.5">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
          active
            ? "border-blush/50 bg-blush/15 text-blush shadow-[0_0_16px_oklch(0.82_0.08_20/0.12)]"
            : "border-transparent text-muted-foreground hover:border-blush/30 hover:bg-blush/10 hover:text-blush",
        )}
      >
        <FolderKanban className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="text-xs tabular-nums opacity-70">{count}</span>
      </button>
      <Link
        to="/admin/projects/$projectId"
        params={{ projectId }}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-blush/10 hover:text-blush group-hover:opacity-100"
        title="Open project"
      >
        <FolderOpen className="h-3 w-3" />
      </Link>
    </div>
  );
}
