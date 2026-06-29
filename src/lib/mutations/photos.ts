import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import type { PhotoCategory } from "@/lib/media-types";
import {
  appendPhotoFolderToCache,
  clearPhotoFolderFromPhotos,
  patchPhotosInCache,
  removePhotoFolderFromCache,
  removePhotosFromCache,
  renamePhotoFolderInCache,
  updatePhotosInCache,
} from "@/lib/photo-cache";
import { invalidateAdminProjectPhotoGroups } from "@/lib/query-invalidation";
import {
  bulkDeletePhotos,
  bulkUpdatePhotos,
  createPhotoFolder,
  deletePhoto,
  deletePhotoFolder,
  updatePhoto,
  updatePhotoFolder,
  uploadPhoto,
} from "@/lib/media";
import { assertNoServerError, ServerMutationError } from "@/lib/mutations/shared";

export function useUploadPhotoMutation() {
  const uploadFn = useServerFn(uploadPhoto);

  return useMutation({
    mutationFn: async (data: Parameters<typeof uploadFn>[0]["data"]) => {
      try {
        const result = await uploadFn({ data });
        if (!result || typeof result !== "object") {
          return { error: "Upload failed. Please try again.", photo: null };
        }
        return result;
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Upload failed.",
          photo: null,
        };
      }
    },
  });
}

export function useUpdatePhotoMutation() {
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updatePhoto);

  return useMutation({
    mutationFn: async (data: Parameters<typeof updateFn>[0]["data"]) => {
      const result = await updateFn({ data });
      assertNoServerError(result);
      return data;
    },
    onSuccess: (data) => {
      updatePhotosInCache(queryClient, (prev) =>
        prev.map((photo) => {
          if (photo.id !== data.id) return photo;
          return {
            ...photo,
            ...(data.title !== undefined ? { title: data.title } : {}),
            ...(data.category !== undefined ? { category: data.category } : {}),
            ...(data.published !== undefined ? { published: data.published } : {}),
            ...(data.featured !== undefined ? { featured: data.featured } : {}),
            ...(data.folder_id !== undefined ? { folder_id: data.folder_id } : {}),
            ...(data.gallery_orientation !== undefined
              ? { gallery_orientation: data.gallery_orientation }
              : {}),
          };
        }),
      );
    },
  });
}

export function useDeletePhotoMutation() {
  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deletePhoto);

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFn({ data: { id } });
      assertNoServerError(result);
      return id;
    },
    onSuccess: (id) => {
      removePhotosFromCache(queryClient, [id]);
      invalidateAdminProjectPhotoGroups(queryClient);
    },
  });
}

export function useBulkUpdatePhotosMutation() {
  const queryClient = useQueryClient();
  const bulkUpdateFn = useServerFn(bulkUpdatePhotos);

  return useMutation({
    mutationFn: async (data: {
      ids: string[];
      category?: PhotoCategory;
      published?: boolean;
      featured?: boolean;
      folder_id?: string | null;
    }) => {
      const result = await bulkUpdateFn({ data });
      assertNoServerError(result);
      return data;
    },
    onSuccess: ({ ids, ...patch }) => {
      patchPhotosInCache(queryClient, new Set(ids), patch);
    },
  });
}

export function useBulkDeletePhotosMutation() {
  const queryClient = useQueryClient();
  const bulkDeleteFn = useServerFn(bulkDeletePhotos);

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await bulkDeleteFn({ data: { ids } });
      assertNoServerError(result);
      return ids;
    },
    onSuccess: (ids) => {
      removePhotosFromCache(queryClient, ids);
      invalidateAdminProjectPhotoGroups(queryClient);
    },
  });
}

export function useCreatePhotoFolderMutation() {
  const queryClient = useQueryClient();
  const createFolderFn = useServerFn(createPhotoFolder);

  return useMutation({
    mutationFn: async (name: string) => {
      const result = await createFolderFn({ data: { name } });
      if (result.error || !result.folder) {
        throw new ServerMutationError(result.error ?? "Could not create folder.");
      }
      return result.folder;
    },
    onSuccess: (folder) => appendPhotoFolderToCache(queryClient, folder),
  });
}

export function useUpdatePhotoFolderMutation() {
  const queryClient = useQueryClient();
  const updateFolderFn = useServerFn(updatePhotoFolder);

  return useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const result = await updateFolderFn({ data });
      assertNoServerError(result);
      return data;
    },
    onSuccess: ({ id, name }) => renamePhotoFolderInCache(queryClient, id, name),
  });
}

export function useDeletePhotoFolderMutation() {
  const queryClient = useQueryClient();
  const deleteFolderFn = useServerFn(deletePhotoFolder);

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFolderFn({ data: { id } });
      assertNoServerError(result);
      return id;
    },
    onSuccess: (id) => {
      removePhotoFolderFromCache(queryClient, id);
      clearPhotoFolderFromPhotos(queryClient, id);
    },
  });
}
