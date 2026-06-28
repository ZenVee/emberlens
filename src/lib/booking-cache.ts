import type { QueryClient } from "@tanstack/react-query";

import type { DbBooking } from "./bookings-types";
import { adminBookingsQueryKey, adminBookingQueryKey } from "./query-keys";

export function patchBookingInCache(
  queryClient: QueryClient,
  bookingId: string,
  patch: Partial<DbBooking>,
) {
  const updatedAt = patch.updated_at ?? new Date().toISOString();
  const next = { ...patch, updated_at: updatedAt };

  queryClient.setQueryData(adminBookingsQueryKey, (prev: DbBooking[] | undefined) =>
    (prev ?? []).map((booking) =>
      booking.id === bookingId ? { ...booking, ...next } : booking,
    ),
  );

  queryClient.setQueryData(adminBookingQueryKey(bookingId), (prev: DbBooking | undefined) => {
    const fromList = queryClient
      .getQueryData<DbBooking[]>(adminBookingsQueryKey)
      ?.find((booking) => booking.id === bookingId);
    const base = prev ?? fromList;
    return base ? { ...base, ...next } : base;
  });
}

export function setBookingInCache(queryClient: QueryClient, booking: DbBooking) {
  queryClient.setQueryData(adminBookingQueryKey(booking.id), booking);
  queryClient.setQueryData(adminBookingsQueryKey, (prev: DbBooking[] | undefined) => {
    const list = prev ?? [];
    const exists = list.some((item) => item.id === booking.id);
    const next = exists
      ? list.map((item) => (item.id === booking.id ? booking : item))
      : [...list, booking];
    return next.sort(
      (a, b) => new Date(a.shoot_at).getTime() - new Date(b.shoot_at).getTime(),
    );
  });
}
