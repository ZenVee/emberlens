import { useCallback, useMemo, useRef, useState } from "react";

import { categorySelectOptions } from "@/lib/categories";
import type { DbPhoto, PhotoCategory } from "@/lib/media-types";
import { useDeletePhotoMutation, useUploadPhotoMutation } from "@/lib/mutations/photos";
import { usePersistProjectMutation } from "@/lib/mutations/projects";
import { mutationErrorMessage } from "@/lib/mutations/shared";
import { appendPhotosToCache } from "@/lib/photo-cache";
import { type AdminProjectData, type ProjectSaveState } from "@/lib/project-cache";
import { invalidateAdminProjectPhotoGroups } from "@/lib/query-invalidation";
import { useSiteSettings } from "@/lib/site-settings-queries";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useQueryClient } from "@tanstack/react-query";

export const NO_PROJECT_CATEGORY = "__none__";

export function useProjectEditor(initial: AdminProjectData) {
  const settings = useSiteSettings();
  const queryClient = useQueryClient();
  const projectCategoryOptions = useMemo(
    () => [
      { value: NO_PROJECT_CATEGORY, label: "None" },
      ...categorySelectOptions(settings.project_categories, initial.project.category),
    ],
    [settings.project_categories, initial.project.category],
  );

  const persistMutation = usePersistProjectMutation();
  const uploadMutation = useUploadPhotoMutation();
  const deletePhotoMutation = useDeletePhotoMutation();

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

  const saveState = useMemo<ProjectSaveState>(
    () => ({
      project,
      coverId,
      photoIds: photos.map((photo) => photo.id),
    }),
    [project, coverId, photos],
  );

  const persistProject = useCallback(
    async (state: ProjectSaveState) => {
      try {
        await persistMutation.mutateAsync({
          ...state,
          photos: state.photoIds
            .map((id) => photosRef.current.find((photo) => photo.id === id))
            .filter((photo): photo is DbPhoto => photo !== undefined),
        });
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          error: mutationErrorMessage(err, "Could not save project."),
        };
      }
    },
    [persistMutation],
  );

  const { status: saveStatus, error: saveError } = useAutoSave(saveState, persistProject);

  async function confirmDeletePhoto() {
    if (!deleteTarget) return;
    setError(null);

    try {
      const deletedId = deleteTarget.id;
      await deletePhotoMutation.mutateAsync(deletedId);
      setPhotos((prev) => {
        const next = prev.filter((photo) => photo.id !== deletedId);
        if (coverId === deletedId) setCoverId(next[0]?.id ?? "");
        return next;
      });
      setDeleteTarget(null);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not delete photo."));
    }
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
    appendPhotosToCache(queryClient, uploaded);
    setPhotos((prev) => [...prev, ...uploaded]);
    if (!coverId && uploaded[0]) setCoverId(uploaded[0].id);
    invalidateAdminProjectPhotoGroups(queryClient);
  }

  function setCategory(value: string) {
    setProject({
      ...project,
      category: value === NO_PROJECT_CATEGORY ? null : (value as PhotoCategory),
    });
  }

  return {
    project,
    setProject,
    photos,
    coverId,
    setCoverId,
    error,
    saveStatus,
    saveError,
    uploadOpen,
    setUploadOpen,
    linkCopied,
    clientLink,
    deleteTarget,
    setDeleteTarget,
    deleting: deletePhotoMutation.isPending,
    projectCategoryOptions,
    photoCategories: settings.photo_categories,
    uploadFn: (payload: Parameters<typeof uploadMutation.mutateAsync>[0]) =>
      uploadMutation.mutateAsync(payload),
    confirmDeletePhoto,
    movePhoto,
    copyClientLink,
    handlePhotosUploaded,
    setCategory,
  };
}

export type ProjectEditorState = ReturnType<typeof useProjectEditor>;
