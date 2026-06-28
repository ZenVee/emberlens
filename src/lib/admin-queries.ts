import { queryOptions, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { fetchAdminBookings, fetchAdminBooking } from "./bookings";
import { fetchAdminPhotos, fetchAdminPhotoFolders, fetchAdminProject, fetchAdminProjectPhotoGroups, fetchAdminProjects } from "./media";
import {
  adminBookingsQueryKey,
  adminBookingQueryKey,
  adminPhotoFoldersQueryKey,
  adminPhotosQueryKey,
  adminProjectPhotoGroupsQueryKey,
  adminProjectQueryKey,
  adminProjectsQueryKey,
} from "./query-keys";
import { siteSettingsQueryOptions } from "./site-settings-queries";

export const adminPhotosQueryOptions = queryOptions({
  queryKey: adminPhotosQueryKey,
  queryFn: () => fetchAdminPhotos(),
});

export const adminPhotoFoldersQueryOptions = queryOptions({
  queryKey: adminPhotoFoldersQueryKey,
  queryFn: () => fetchAdminPhotoFolders(),
});

export function useAdminPhotoFolders() {
  return useQuery(adminPhotoFoldersQueryOptions);
}

export const adminProjectPhotoGroupsQueryOptions = queryOptions({
  queryKey: adminProjectPhotoGroupsQueryKey,
  queryFn: () => fetchAdminProjectPhotoGroups(),
});

export function useAdminProjectPhotoGroups() {
  return useQuery(adminProjectPhotoGroupsQueryOptions);
}

export const adminProjectsQueryOptions = queryOptions({
  queryKey: adminProjectsQueryKey,
  queryFn: () => fetchAdminProjects(),
});

export function adminProjectQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: adminProjectQueryKey(projectId),
    queryFn: () => fetchAdminProject({ data: { id: projectId } }),
  });
}

export function useAdminPhotos() {
  return useQuery(adminPhotosQueryOptions);
}

export function useAdminProjects() {
  return useQuery(adminProjectsQueryOptions);
}

export function useAdminProject(projectId: string) {
  return useQuery(adminProjectQueryOptions(projectId));
}

export const adminSiteSettingsQueryOptions = queryOptions(siteSettingsQueryOptions);

export function useAdminSiteSettings() {
  return useQuery(adminSiteSettingsQueryOptions);
}

export function prefetchAdminDashboard(queryClient: QueryClient) {
  void queryClient.prefetchQuery(adminPhotosQueryOptions);
  void queryClient.prefetchQuery(adminProjectsQueryOptions);
  void queryClient.prefetchQuery(adminBookingsQueryOptions);
}

export const adminBookingsQueryOptions = queryOptions({
  queryKey: adminBookingsQueryKey,
  queryFn: () => fetchAdminBookings(),
});

export function adminBookingQueryOptions(bookingId: string) {
  return queryOptions({
    queryKey: adminBookingQueryKey(bookingId),
    queryFn: () => fetchAdminBooking({ data: { id: bookingId } }),
  });
}

export function useAdminBooking(bookingId: string) {
  return useQuery(adminBookingQueryOptions(bookingId));
}

export function useAdminBookings() {
  return useQuery(adminBookingsQueryOptions);
}

export function prefetchAdminBooking(queryClient: QueryClient, bookingId: string) {
  void queryClient.prefetchQuery(adminBookingQueryOptions(bookingId));
}

export function prefetchAdminRoute(queryClient: QueryClient, path: string) {
  if (path.startsWith("/admin/photos")) {
    void queryClient.prefetchQuery(adminPhotosQueryOptions);
    void queryClient.prefetchQuery(adminProjectPhotoGroupsQueryOptions);
    return;
  }
  if (path.startsWith("/admin/bookings")) {
    void queryClient.prefetchQuery(adminBookingsQueryOptions);
    return;
  }
  if (path.startsWith("/admin/projects")) {
    void queryClient.prefetchQuery(adminProjectsQueryOptions);
    void queryClient.prefetchQuery(adminPhotosQueryOptions);
  }
}

export function prefetchAdminProject(queryClient: QueryClient, projectId: string) {
  void queryClient.prefetchQuery(adminProjectQueryOptions(projectId));
}
