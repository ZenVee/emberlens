import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import type { DbPhoto, PhotoCategory } from "@/lib/media-types";
import {
  appendProjectToListCache,
  patchProjectInListCache,
  removeProjectFromListCache,
  syncProjectCaches,
  syncProjectPaidToBookingsInCache,
  type ProjectSaveState,
} from "@/lib/project-cache";
import {
  invalidateAdminPhotosAfterProjectDelete,
  invalidateAdminProjectPhotoGroups,
} from "@/lib/query-invalidation";
import { createProject, deleteProject, setProjectPhotos, updateProject } from "@/lib/media";
import { assertNoServerError, ServerMutationError } from "@/lib/mutations/shared";

type CreateProjectInput = {
  title: string;
  client?: string;
  description?: string;
  category?: PhotoCategory | string;
  shoot_date?: string;
};

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  const createFn = useServerFn(createProject);

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const result = await createFn({
        data: {
          ...data,
          category: data.category as PhotoCategory | undefined,
        },
      });
      if (result.error || !result.project) {
        throw new ServerMutationError(result.error ?? "Could not create project.");
      }
      return result.project;
    },
    onSuccess: (project) => appendProjectToListCache(queryClient, project),
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updateProject);

  return useMutation({
    mutationFn: async (data: {
      id: string;
      published?: boolean;
      client_paid?: boolean;
      public_watermarked?: boolean;
      title?: string;
      client?: string;
      description?: string;
      category?: PhotoCategory | null;
      shoot_date?: string | null;
      cover_photo_id?: string | null;
      download_link?: string | null;
      sort_order?: number;
    }) => {
      const result = await updateFn({ data });
      assertNoServerError(result);
      return data;
    },
    onSuccess: (data) => {
      if (data.published !== undefined) {
        patchProjectInListCache(queryClient, data.id, { published: data.published });
      }
      if (data.client_paid !== undefined) {
        const clientPaidAt = data.client_paid ? new Date().toISOString() : null;
        syncProjectPaidToBookingsInCache(queryClient, data.id, clientPaidAt);
      }
    },
  });
}

export function useSetProjectPhotosMutation() {
  const setPhotosFn = useServerFn(setProjectPhotos);

  return useMutation({
    mutationFn: async (data: { projectId: string; photoIds: string[] }) => {
      const result = await setPhotosFn({ data });
      assertNoServerError(result);
      return data;
    },
  });
}

export type PersistProjectVariables = ProjectSaveState & { photos: DbPhoto[] };

export function usePersistProjectMutation() {
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updateProject);
  const setPhotosFn = useServerFn(setProjectPhotos);

  return useMutation({
    mutationFn: async (state: PersistProjectVariables) => {
      const updateResult = await updateFn({
        data: {
          id: state.project.id,
          title: state.project.title,
          client: state.project.client ?? "",
          description: state.project.description ?? "",
          category: state.project.category,
          shoot_date: state.project.shoot_date,
          download_link: state.project.download_link,
          cover_photo_id: state.coverId || null,
          published: state.project.published,
          client_paid: Boolean(state.project.client_paid_at),
          public_watermarked: state.project.public_watermarked,
        },
      });
      assertNoServerError(updateResult);

      const photosResult = await setPhotosFn({
        data: { projectId: state.project.id, photoIds: state.photoIds },
      });
      assertNoServerError(photosResult);

      return state;
    },
    onSuccess: (state) => {
      syncProjectPaidToBookingsInCache(queryClient, state.project.id, state.project.client_paid_at);
      syncProjectCaches(queryClient, state.project.id, state, state.photos);
      invalidateAdminProjectPhotoGroups(queryClient);
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deleteProject);

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFn({ data: { id } });
      assertNoServerError(result);
      return id;
    },
    onSuccess: (id) => {
      removeProjectFromListCache(queryClient, id);
      invalidateAdminPhotosAfterProjectDelete(queryClient);
    },
  });
}

export function useToggleProjectPublishedMutation() {
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updateProject);

  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const result = await updateFn({ data: { id, published: !published } });
      assertNoServerError(result);
      return { id, published: !published };
    },
    onSuccess: ({ id, published }) => {
      patchProjectInListCache(queryClient, id, { published });
    },
  });
}
