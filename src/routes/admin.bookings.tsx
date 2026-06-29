import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import {
  BookingsCalendarSection,
  BookingsDateFilter,
  BookingsListToolbar,
  BookingsTable,
} from "@/components/admin/bookings/bookings-list";
import { CreateBookingDialog } from "@/components/admin/bookings/create-booking-dialog";
import { useAdminPageMeta } from "@/components/use-admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAdminBookingsList } from "@/hooks/admin/use-admin-bookings";
import { formatBookingDateTime } from "@/lib/bookings-types";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Ember Lens Studio" }] }),
  component: AdminBookings,
});

function AdminBookings() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/admin/bookings") return <Outlet />;
  return <AdminBookingsList />;
}

function AdminBookingsList() {
  const list = useAdminBookingsList();

  useAdminPageMeta({
    title: "Bookings",
    subtitle:
      list.bookings.length === 0
        ? "No booking requests yet"
        : `${list.pendingCount} pending · ${list.bookings.length} total`,
  });

  if (list.isPending) return <AdminLoading variant="table" />;
  if (list.isError) {
    return (
      <p className="rounded-2xl border border-destructive/40 bg-destructive/5 px-6 py-16 text-center text-destructive">
        {list.loadError instanceof Error ? list.loadError.message : "Could not load bookings."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <BookingsListToolbar
        statusFilter={list.statusFilter}
        setStatusFilter={list.setStatusFilter}
        openCreateDialog={list.openCreateDialog}
      />

      <BookingsDateFilter selectedDate={list.selectedDate} setSelectedDate={list.setSelectedDate} />

      {list.error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {list.error}
        </p>
      )}

      <BookingsCalendarSection
        bookings={list.bookings}
        selectedDate={list.selectedDate}
        setSelectedDate={list.setSelectedDate}
        calendarMonth={list.calendarMonth}
        setCalendarMonth={list.setCalendarMonth}
      />

      <BookingsTable
        bookings={list.bookings}
        filtered={list.filtered}
        statusFilter={list.statusFilter}
        setStatus={list.setStatus}
        setDeleteTarget={list.setDeleteTarget}
      />

      <CreateBookingDialog
        open={list.createOpen}
        onOpenChange={list.setCreateOpen}
        sessionTypes={list.sessionTypes}
        defaultSessionType={list.defaultSessionType}
      />

      <ConfirmDialog
        open={list.deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !list.deleting) list.setDeleteTarget(null);
        }}
        title="Delete booking"
        description={
          list.deleteTarget
            ? `Delete the booking for ${list.deleteTarget.client_name} on ${formatBookingDateTime(list.deleteTarget.shoot_at)}?`
            : "Delete this booking?"
        }
        confirmLabel="Delete"
        destructive
        loading={list.deleting}
        onConfirm={list.confirmDelete}
      />
    </div>
  );
}
