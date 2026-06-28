export const authUserQueryKey = ["auth", "user"] as const;
export const adminPhotosQueryKey = ["admin", "photos"] as const;
export const adminProjectsQueryKey = ["admin", "projects"] as const;
export const adminBookingsQueryKey = ["admin", "bookings"] as const;
export const adminProjectQueryKey = (id: string) => ["admin", "project", id] as const;
export const adminBookingQueryKey = (id: string) => ["admin", "booking", id] as const;
export const siteSettingsQueryKey = ["site", "settings"] as const;
