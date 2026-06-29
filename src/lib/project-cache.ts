import type { QueryClient } from "@tanstack/react-query";

import type { DbBooking } from "./bookings-types";
import type { DbPhoto, DbProject } from "./media-types";
import {
  adminBookingsQueryKey,
  adminBookingQueryKey,
  adminProjectQueryKey,
  adminProjectsQueryKey,
} from "./query-keys";

export type AdminProjectData = {
  project: DbProject;
  assignedPhotos: { sort_order: number; photo: DbPhoto }[];
};

export type ProjectSaveState = {
  project: DbProject;
  coverId: string;
  photoIds: string[];
};

type AdminProjectListItem = DbProject & {
  photoCount: number;
  coverUrl: string | null;
};

export function appendProjectToListCache(queryClient: QueryClient, project: DbProject) {
  queryClient.setQueryData(adminProjectsQueryKey, (prev: AdminProjectListItem[] | undefined) => [
    { ...project, photoCount: 0, coverUrl: null },
    ...(prev ?? []),
  ]);
}

export function removeProjectFromListCache(queryClient: QueryClient, projectId: string) {
  queryClient.setQueryData(adminProjectsQueryKey, (prev: AdminProjectListItem[] | undefined) =>
    (prev ?? []).filter((project) => project.id !== projectId),
  );
}

export function patchProjectInListCache(
  queryClient: QueryClient,
  projectId: string,
  patch: Partial<AdminProjectListItem>,
) {
  queryClient.setQueryData(adminProjectsQueryKey, (prev: AdminProjectListItem[] | undefined) =>
    (prev ?? []).map((project) => (project.id === projectId ? { ...project, ...patch } : project)),
  );
}

export function syncProjectPaidToBookingsInCache(
  queryClient: QueryClient,
  projectId: string,
  clientPaidAt: string | null,
) {
  queryClient.setQueryData(adminBookingsQueryKey, (prev: DbBooking[] | undefined) => {
    const next =
      prev?.map((booking) =>
        booking.project_id === projectId ? { ...booking, client_paid_at: clientPaidAt } : booking,
      ) ?? prev;
    if (next) {
      for (const booking of next) {
        if (booking.project_id === projectId) {
          queryClient.setQueryData(adminBookingQueryKey(booking.id), booking);
        }
      }
    }
    return next;
  });
}

export function syncProjectCaches(
  queryClient: QueryClient,
  projectId: string,
  state: ProjectSaveState,
  nextPhotos: DbPhoto[],
) {
  queryClient.setQueryData(
    adminProjectQueryKey(projectId),
    (prev: AdminProjectData | undefined) => {
      if (!prev) return prev;
      return {
        project: {
          ...state.project,
          cover_photo_id: state.coverId || null,
        },
        assignedPhotos: state.photoIds
          .map((id, sort_order) => {
            const photo = nextPhotos.find((item) => item.id === id);
            return photo ? { sort_order, photo } : null;
          })
          .filter((item): item is { sort_order: number; photo: DbPhoto } => item !== null),
      };
    },
  );

  queryClient.setQueryData(adminProjectsQueryKey, (prev) =>
    prev?.map((item) =>
      item.id === projectId
        ? {
            ...item,
            title: state.project.title,
            client: state.project.client,
            category: state.project.category,
            shoot_date: state.project.shoot_date,
            published: state.project.published,
            client_paid_at: state.project.client_paid_at,
            coverUrl:
              nextPhotos.find((photo) => photo.id === state.coverId)?.cdn_url ?? item.coverUrl,
            photoCount: nextPhotos.length,
          }
        : item,
    ),
  );
}
