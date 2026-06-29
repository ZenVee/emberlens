import type { QueryClient } from "@tanstack/react-query";

import { adminPhotosQueryKey, adminProjectPhotoGroupsQueryKey } from "./query-keys";

export function invalidateAdminProjectPhotoGroups(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminProjectPhotoGroupsQueryKey });
}

export function invalidateAdminPhotosAfterProjectDelete(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminPhotosQueryKey });
  invalidateAdminProjectPhotoGroups(queryClient);
}
