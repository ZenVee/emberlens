import { queryOptions, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { fetchAdminPhotos, fetchAdminProject, fetchAdminProjects } from "./media";
import { adminPhotosQueryKey, adminProjectQueryKey, adminProjectsQueryKey } from "./query-keys";
import { siteSettingsQueryOptions } from "./site-settings-queries";

export const adminPhotosQueryOptions = queryOptions({
  queryKey: adminPhotosQueryKey,
  queryFn: () => fetchAdminPhotos(),
});

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
}

export function prefetchAdminRoute(queryClient: QueryClient, path: string) {
  if (path.startsWith("/admin/photos")) {
    void queryClient.prefetchQuery(adminPhotosQueryOptions);
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
