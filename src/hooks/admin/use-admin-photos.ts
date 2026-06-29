import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useAdminPageMeta } from "@/components/use-admin-page-meta";
import { categorySelectOptions } from "@/lib/categories";
import {
  useAdminPhotoFolders,
  useAdminPhotos,
  useAdminProjectPhotoGroups,
} from "@/lib/admin-queries";
import type { DbPhoto, PhotoCategory } from "@/lib/media-types";
import { appendPhotosToCache, updatePhotosInCache } from "@/lib/photo-cache";
import {
  isManualFolderFilter,
  isProjectFolderFilter,
  projectIdFromFolderFilter,
  type FolderFilter,
} from "@/lib/photo-folder-utils";
import {
  useBulkDeletePhotosMutation,
  useBulkUpdatePhotosMutation,
  useCreatePhotoFolderMutation,
  useDeletePhotoFolderMutation,
  useDeletePhotoMutation,
  useUpdatePhotoFolderMutation,
  useUpdatePhotoMutation,
  useUploadPhotoMutation,
} from "@/lib/mutations/photos";
import { mutationErrorMessage } from "@/lib/mutations/shared";
import { useSiteSettings } from "@/lib/site-settings-queries";

export type PhotoStatusFilter = "all" | "published" | "draft" | "featured";

export const PHOTO_STATUS_FILTERS: { value: PhotoStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "featured", label: "Featured" },
];

export const NO_PHOTO_FOLDER = "__none__";

export function useAdminPhotosPage() {
  const settings = useSiteSettings();
  const photoCategories = settings.photo_categories;

  const categoryFilterOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...photoCategories.map((c) => ({ value: c, label: c })),
    ],
    [photoCategories],
  );
  const categoryOptions = useMemo(() => categorySelectOptions(photoCategories), [photoCategories]);

  const { data: photos = [], isPending, isError, error: loadError } = useAdminPhotos();
  const { data: folders = [] } = useAdminPhotoFolders();
  const { data: projectPhotoGroups = [] } = useAdminProjectPhotoGroups();

  const projectPhotoIdSet = useMemo(() => {
    const ids = new Set<string>();
    for (const group of projectPhotoGroups) {
      for (const id of group.photoIds) ids.add(id);
    }
    return ids;
  }, [projectPhotoGroups]);

  const photoIdsByProject = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const group of projectPhotoGroups) {
      map.set(group.projectId, new Set(group.photoIds));
    }
    return map;
  }, [projectPhotoGroups]);

  const uploadMutation = useUploadPhotoMutation();
  const updateMutation = useUpdatePhotoMutation();
  const deleteMutation = useDeletePhotoMutation();
  const bulkUpdateMutation = useBulkUpdatePhotosMutation();
  const bulkDeleteMutation = useBulkDeletePhotosMutation();
  const createFolderMutation = useCreatePhotoFolderMutation();
  const updateFolderMutation = useUpdatePhotoFolderMutation();
  const deleteFolderMutation = useDeletePhotoFolderMutation();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [folderFilter, setFolderFilter] = useState<FolderFilter>("all");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PhotoCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PhotoStatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<PhotoCategory>(
    () => photoCategories[0] ?? "Portrait",
  );
  const [bulkFolder, setBulkFolder] = useState(NO_PHOTO_FOLDER);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<DbPhoto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DbPhoto | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const folderCounts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    let unfiled = 0;
    let all = 0;
    for (const photo of photos) {
      if (projectPhotoIdSet.has(photo.id)) continue;
      all += 1;
      if (photo.folder_id) {
        byFolder[photo.folder_id] = (byFolder[photo.folder_id] ?? 0) + 1;
      } else {
        unfiled += 1;
      }
    }
    return { all, unfiled, byFolder };
  }, [photos, projectPhotoIdSet]);

  const projectFolders = useMemo(
    () =>
      projectPhotoGroups.map((group) => ({
        projectId: group.projectId,
        title: group.title,
        count: group.photoIds.length,
      })),
    [projectPhotoGroups],
  );

  const folderOptions = useMemo(
    () => [
      { value: NO_PHOTO_FOLDER, label: "No folder" },
      ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
    ],
    [folders],
  );

  const uploadFolderId = isManualFolderFilter(folderFilter) ? folderFilter : null;

  const hasActiveFilters =
    folderFilter !== "all" ||
    query.trim() !== "" ||
    categoryFilter !== "all" ||
    statusFilter !== "all";

  useAdminPageMeta({
    title: "Photos",
    subtitle: "Upload, organize, and publish your gallery.",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return photos.filter((p) => {
      if (isProjectFolderFilter(folderFilter)) {
        const projectIds = photoIdsByProject.get(projectIdFromFolderFilter(folderFilter));
        if (!projectIds?.has(p.id)) return false;
      } else if (folderFilter === "unfiled") {
        if (p.folder_id || projectPhotoIdSet.has(p.id)) return false;
      } else if (isManualFolderFilter(folderFilter)) {
        if (p.folder_id !== folderFilter) return false;
      } else if (projectPhotoIdSet.has(p.id)) {
        return false;
      }

      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter === "published" && !p.published) return false;
      if (statusFilter === "draft" && p.published) return false;
      if (statusFilter === "featured" && !p.featured) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [
    photos,
    query,
    categoryFilter,
    statusFilter,
    projectPhotoIdSet,
    photoIdsByProject,
    folderFilter,
  ]);

  const filteredIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someFilteredSelected = filtered.some((p) => selected.has(p.id));
  const selectedCount = selected.size;

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id);
      } else {
        for (const id of filteredIds) next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function clearFilters() {
    setFolderFilter("all");
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  }

  async function handleCreateFolder(name: string) {
    try {
      const folder = await createFolderMutation.mutateAsync(name);
      setFolderFilter(folder.id);
      return null;
    } catch (err) {
      return mutationErrorMessage(err, "Could not create folder.");
    }
  }

  async function handleRenameFolder(id: string, name: string) {
    try {
      await updateFolderMutation.mutateAsync({ id, name });
      return null;
    } catch (err) {
      return mutationErrorMessage(err, "Could not rename folder.");
    }
  }

  async function handleDeleteFolder(id: string) {
    try {
      await deleteFolderMutation.mutateAsync(id);
      if (folderFilter === id) setFolderFilter("all");
      return null;
    } catch (err) {
      return mutationErrorMessage(err, "Could not delete folder.");
    }
  }

  async function togglePublished(photo: DbPhoto) {
    setError(null);
    try {
      await updateMutation.mutateAsync({ id: photo.id, published: !photo.published });
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not update photo."));
    }
  }

  async function toggleFeatured(photo: DbPhoto) {
    setError(null);
    try {
      await updateMutation.mutateAsync({ id: photo.id, featured: !photo.featured });
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not update photo."));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not delete photo."));
    }
  }

  async function confirmBulkDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setError(null);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      clearSelection();
      setBulkDeleteOpen(false);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not delete photos."));
    }
  }

  async function runBulkUpdate(patch: {
    category?: PhotoCategory;
    published?: boolean;
    featured?: boolean;
    folder_id?: string | null;
  }) {
    const ids = [...selected];
    if (ids.length === 0) return;
    setError(null);
    try {
      await bulkUpdateMutation.mutateAsync({ ids, ...patch });
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not update photos."));
    }
  }

  async function saveEdit(updated: DbPhoto) {
    await updateMutation.mutateAsync({
      id: updated.id,
      title: updated.title,
      category: updated.category,
      folder_id: updated.folder_id,
      gallery_orientation: updated.gallery_orientation,
    });
    updatePhotosInCache(queryClient, (prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
  }

  function handleUploaded(uploaded: DbPhoto[]) {
    setError(null);
    appendPhotosToCache(queryClient, uploaded);
  }

  return {
    photoCategories,
    categoryFilterOptions,
    categoryOptions,
    photos,
    folders,
    isPending,
    isError,
    loadError,
    view,
    setView,
    folderFilter,
    setFolderFilter,
    query,
    setQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    selected,
    bulkCategory,
    setBulkCategory,
    bulkFolder,
    setBulkFolder,
    bulkWorking: bulkUpdateMutation.isPending,
    uploadOpen,
    setUploadOpen,
    error,
    editing,
    setEditing,
    deleteTarget,
    setDeleteTarget,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    deleting: deleteMutation.isPending || bulkDeleteMutation.isPending,
    folderCounts,
    projectFolders,
    folderOptions,
    uploadFolderId,
    hasActiveFilters,
    filtered,
    allFilteredSelected,
    someFilteredSelected,
    selectedCount,
    toggleSelected,
    toggleSelectAllFiltered,
    clearSelection,
    clearFilters,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    togglePublished,
    toggleFeatured,
    confirmDelete,
    confirmBulkDelete,
    runBulkUpdate,
    saveEdit,
    handleUploaded,
    uploadFn: (payload: Parameters<typeof uploadMutation.mutateAsync>[0]) =>
      uploadMutation.mutateAsync(payload),
  };
}

export type AdminPhotosPageState = ReturnType<typeof useAdminPhotosPage>;
