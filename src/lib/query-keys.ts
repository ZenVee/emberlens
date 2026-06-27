export const authUserQueryKey = ["auth", "user"] as const;
export const adminPhotosQueryKey = ["admin", "photos"] as const;
export const adminProjectsQueryKey = ["admin", "projects"] as const;
export const adminProjectQueryKey = (id: string) => ["admin", "project", id] as const;
