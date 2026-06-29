import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  patchBookingInCache,
  removeBookingFromCache,
  setBookingInCache,
  syncBookingProjectPaidInCache,
} from "@/lib/booking-cache";
import type { BookingStatus } from "@/lib/bookings-types";
import type { AdminBookingCreateForm, BookingForm } from "@/lib/booking-form";
import {
  createAdminBooking,
  deleteBooking,
  updateBooking,
  updateBookingStatus,
} from "@/lib/bookings";
import { assertNoServerError, ServerMutationError } from "@/lib/mutations/shared";

export function useCreateAdminBookingMutation() {
  const queryClient = useQueryClient();
  const createFn = useServerFn(createAdminBooking);

  return useMutation({
    mutationFn: async (data: AdminBookingCreateForm) => {
      const result = await createFn({ data });
      if (result.error || !result.booking) {
        throw new ServerMutationError(result.error ?? "Could not create booking.");
      }
      return result.booking;
    },
    onSuccess: (booking) => setBookingInCache(queryClient, booking),
  });
}

export function useUpdateBookingStatusMutation() {
  const queryClient = useQueryClient();
  const updateStatusFn = useServerFn(updateBookingStatus);

  return useMutation({
    mutationFn: async (data: { id: string; status: BookingStatus }) => {
      const result = await updateStatusFn({ data });
      assertNoServerError(result);
      return data;
    },
    onSuccess: ({ id, status }) => patchBookingInCache(queryClient, id, { status }),
  });
}

export function useDeleteBookingMutation() {
  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deleteBooking);

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFn({ data: { id } });
      assertNoServerError(result);
      return id;
    },
    onSuccess: (id) => removeBookingFromCache(queryClient, id),
  });
}

export function useUpdateBookingMutation() {
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updateBooking);

  return useMutation({
    mutationFn: async (data: BookingForm & { id: string }) => {
      const result = await updateFn({ data });
      if (result.error || !result.booking) {
        throw new ServerMutationError(result.error ?? "Could not save booking.");
      }
      return result.booking;
    },
    onSuccess: (booking) => {
      setBookingInCache(queryClient, booking);
      syncBookingProjectPaidInCache(queryClient, booking);
    },
  });
}
