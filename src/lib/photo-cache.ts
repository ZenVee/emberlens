import type { QueryClient } from "@tanstack/react-query";

import type { DbPhoto, DbPhotoFolder } from "./media-types";
import { adminPhotoFoldersQueryKey, adminPhotosQueryKey } from "./query-keys";

export function updatePhotosInCache(
  queryClient: QueryClient,
  updater: (prev: DbPhoto[]) => DbPhoto[],
) {
  queryClient.setQueryData(adminPhotosQueryKey, (prev: DbPhoto[] | undefined) =>
    updater(prev ?? []),
  );
}

export function appendPhotosToCache(queryClient: QueryClient, photos: DbPhoto[]) {
  updatePhotosInCache(queryClient, (prev) => [...photos, ...prev]);
}

export function removePhotosFromCache(queryClient: QueryClient, ids: Set<string> | string[]) {
  const idSet = ids instanceof Set ? ids : new Set(ids);
  updatePhotosInCache(queryClient, (prev) => prev.filter((photo) => !idSet.has(photo.id)));
}

export function patchPhotosInCache(
  queryClient: QueryClient,
  ids: Set<string>,
  patch: Partial<DbPhoto>,
) {
  updatePhotosInCache(queryClient, (prev) =>
    prev.map((photo) => (ids.has(photo.id) ? { ...photo, ...patch } : photo)),
  );
}

export function appendPhotoFolderToCache(queryClient: QueryClient, folder: DbPhotoFolder) {
  queryClient.setQueryData(adminPhotoFoldersQueryKey, (prev) => [...(prev ?? []), folder]);
}

export function renamePhotoFolderInCache(queryClient: QueryClient, id: string, name: string) {
  queryClient.setQueryData(adminPhotoFoldersQueryKey, (prev) =>
    (prev ?? []).map((folder) => (folder.id === id ? { ...folder, name: name.trim() } : folder)),
  );
}

export function removePhotoFolderFromCache(queryClient: QueryClient, id: string) {
  queryClient.setQueryData(adminPhotoFoldersQueryKey, (prev) =>
    (prev ?? []).filter((folder) => folder.id !== id),
  );
}

export function clearPhotoFolderFromPhotos(queryClient: QueryClient, folderId: string) {
  updatePhotosInCache(queryClient, (prev) =>
    prev.map((photo) => (photo.folder_id === folderId ? { ...photo, folder_id: null } : photo)),
  );
}
