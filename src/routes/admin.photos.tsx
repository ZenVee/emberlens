import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";

import { PhotoBulkBar } from "@/components/admin/photos/photo-bulk-bar";
import { PhotoFilters } from "@/components/admin/photos/photo-filters";
import { PhotoGallery } from "@/components/admin/photos/photo-gallery";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PhotoEditDialog } from "@/components/photo-edit-dialog";
import { PhotoFolderNav } from "@/components/photo-folder-nav";
import { PhotoUploadModal } from "@/components/photo-upload-modal";
import { Button } from "@/components/ui/button";
import { useAdminPhotosPage } from "@/hooks/admin/use-admin-photos";

export const Route = createFileRoute("/admin/photos")({
  head: () => ({ meta: [{ title: "Photos — Ember Lens Studio" }] }),
  component: AdminPhotos,
});

function AdminPhotos() {
  const page = useAdminPhotosPage();

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-6">
      <PhotoFolderNav
        folders={page.folders}
        projectFolders={page.projectFolders}
        active={page.folderFilter}
        counts={page.folderCounts}
        onSelect={page.setFolderFilter}
        onCreate={page.handleCreateFolder}
        onRename={page.handleRenameFolder}
        onDelete={page.handleDeleteFolder}
      />

      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {page.photos.length} photo{page.photos.length === 1 ? "" : "s"}
            {page.filtered.length !== page.photos.length && ` · ${page.filtered.length} shown`}
          </p>
          <Button
            type="button"
            onClick={() => page.setUploadOpen(true)}
            className="rounded-full bg-gradient-ember shadow-glow hover:opacity-90"
          >
            <Upload /> Upload photos
          </Button>
        </div>

        <PhotoFilters
          photos={page.photos}
          query={page.query}
          setQuery={page.setQuery}
          statusFilter={page.statusFilter}
          setStatusFilter={page.setStatusFilter}
          categoryFilter={page.categoryFilter}
          setCategoryFilter={page.setCategoryFilter}
          categoryFilterOptions={page.categoryFilterOptions}
          view={page.view}
          setView={page.setView}
          filtered={page.filtered}
          allFilteredSelected={page.allFilteredSelected}
          someFilteredSelected={page.someFilteredSelected}
          toggleSelectAllFiltered={page.toggleSelectAllFiltered}
          hasActiveFilters={page.hasActiveFilters}
          clearFilters={page.clearFilters}
        />

        {(page.error || page.isError) && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {page.error ??
              (page.loadError instanceof Error ? page.loadError.message : "Could not load photos.")}
          </p>
        )}

        <PhotoGallery
          isPending={page.isPending}
          photos={page.photos}
          filtered={page.filtered}
          hasActiveFilters={page.hasActiveFilters}
          clearFilters={page.clearFilters}
          view={page.view}
          selected={page.selected}
          toggleSelected={page.toggleSelected}
          setEditing={page.setEditing}
          setDeleteTarget={page.setDeleteTarget}
          togglePublished={page.togglePublished}
          toggleFeatured={page.toggleFeatured}
          togglePublicWatermarked={page.togglePublicWatermarked}
        />

        <PhotoBulkBar
          selectedCount={page.selectedCount}
          bulkWorking={page.bulkWorking}
          runBulkUpdate={page.runBulkUpdate}
          bulkFolder={page.bulkFolder}
          setBulkFolder={page.setBulkFolder}
          folderOptions={page.folderOptions}
          bulkCategory={page.bulkCategory}
          setBulkCategory={page.setBulkCategory}
          categoryOptions={page.categoryOptions}
          clearSelection={page.clearSelection}
          setBulkDeleteOpen={page.setBulkDeleteOpen}
          runBulkRegenerateWatermarks={page.runBulkRegenerateWatermarks}
          watermarkProgress={page.watermarkProgress}
        />

        <PhotoUploadModal
          open={page.uploadOpen}
          onOpenChange={page.setUploadOpen}
          categories={page.photoCategories}
          onUpload={(data) => page.uploadFn({ ...data, folderId: page.uploadFolderId })}
          onUploaded={page.handleUploaded}
        />

        <ConfirmDialog
          open={page.deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open && !page.deleting) page.setDeleteTarget(null);
          }}
          title="Delete photo"
          description={
            page.deleteTarget
              ? `Delete "${page.deleteTarget.title}"? This cannot be undone.`
              : "Delete this photo? This cannot be undone."
          }
          confirmLabel="Delete"
          destructive
          loading={page.deleting}
          onConfirm={page.confirmDelete}
        />

        <ConfirmDialog
          open={page.bulkDeleteOpen}
          onOpenChange={(open) => {
            if (!open && !page.deleting) page.setBulkDeleteOpen(false);
          }}
          title="Delete selected photos"
          description={`Delete ${page.selectedCount} photo${page.selectedCount === 1 ? "" : "s"}? This cannot be undone.`}
          confirmLabel="Delete all"
          destructive
          loading={page.deleting}
          onConfirm={page.confirmBulkDelete}
        />

        <PhotoEditDialog
          photo={page.editing}
          categories={page.photoCategories}
          folders={page.folders}
          onClose={() => page.setEditing(null)}
          onSave={(updated) => page.saveEdit(updated)}
          onRegenerateWatermark={(photo) => page.regenerateEditWatermark(photo)}
          regenerating={page.regenerateWorking}
        />
      </div>
    </div>
  );
}
