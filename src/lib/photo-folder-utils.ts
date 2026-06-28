export const PROJECT_FOLDER_PREFIX = "project:";

export type FolderFilter = "all" | "unfiled" | string;

export function projectFolderFilter(projectId: string) {
  return `${PROJECT_FOLDER_PREFIX}${projectId}`;
}

export function isProjectFolderFilter(filter: FolderFilter): filter is string {
  return filter !== "all" && filter !== "unfiled" && filter.startsWith(PROJECT_FOLDER_PREFIX);
}

export function projectIdFromFolderFilter(filter: string) {
  return filter.slice(PROJECT_FOLDER_PREFIX.length);
}

export function isManualFolderFilter(filter: FolderFilter) {
  return filter !== "all" && filter !== "unfiled" && !isProjectFolderFilter(filter);
}
