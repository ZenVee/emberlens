import { useMemo, useState } from "react";

import { useAdminBookings, useAdminSiteSettings } from "@/lib/admin-queries";
import { DEFAULT_SESSION_TYPES } from "@/lib/categories";
import {
  bookingDateKey,
  bookingDateKeyFromIso,
  type BookingStatus,
  type DbBooking,
} from "@/lib/bookings-types";
import { useDeleteBookingMutation, useUpdateBookingStatusMutation } from "@/lib/mutations/bookings";
import { mutationErrorMessage } from "@/lib/mutations/shared";

export type StatusFilter = "all" | BookingStatus;

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Completed", label: "Completed" },
  { value: "Declined", label: "Declined" },
];

export function useAdminBookingsList() {
  const { data: bookings = [], isPending, isError, error: loadError } = useAdminBookings();
  const { data: settings } = useAdminSiteSettings();
  const deleteMutation = useDeleteBookingMutation();
  const updateStatusMutation = useUpdateBookingStatusMutation();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionTypes = settings?.session_types ?? [...DEFAULT_SESSION_TYPES];
  const defaultSessionType = sessionTypes[0] ?? DEFAULT_SESSION_TYPES[0];

  const pendingCount = bookings.filter((b) => b.status === "Pending").length;

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) return false;
      if (
        selectedDate &&
        bookingDateKeyFromIso(booking.shoot_at) !== bookingDateKey(selectedDate)
      ) {
        return false;
      }
      return true;
    });
  }, [bookings, statusFilter, selectedDate]);

  async function setStatus(id: string, status: BookingStatus) {
    setError(null);
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not update status."));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not delete booking."));
    }
  }

  return {
    bookings,
    isPending,
    isError,
    loadError,
    statusFilter,
    setStatusFilter,
    selectedDate,
    setSelectedDate,
    calendarMonth,
    setCalendarMonth,
    createOpen,
    setCreateOpen,
    deleteTarget,
    setDeleteTarget,
    deleting: deleteMutation.isPending,
    error,
    sessionTypes,
    defaultSessionType,
    pendingCount,
    filtered,
    setStatus,
    confirmDelete,
    openCreateDialog: () => setCreateOpen(true),
  };
}

export type AdminBookingsListState = ReturnType<typeof useAdminBookingsList>;
