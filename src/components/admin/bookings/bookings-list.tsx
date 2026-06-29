import { useNavigate } from "@tanstack/react-router";
import { Check, CircleCheck, Plus, Trash2, X } from "lucide-react";

import { BookingsCalendar } from "@/components/bookings-calendar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_FILTERS, type AdminBookingsListState } from "@/hooks/admin/use-admin-bookings";
import { formatBookingDateTime } from "@/lib/bookings-types";
import { cn } from "@/lib/utils";

type BookingsListToolbarProps = Pick<
  AdminBookingsListState,
  "statusFilter" | "setStatusFilter" | "openCreateDialog"
>;

export function BookingsListToolbar({
  statusFilter,
  setStatusFilter,
  openCreateDialog,
}: BookingsListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              statusFilter === filter.value
                ? "border-ember bg-gradient-ember text-primary-foreground shadow-glow"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <Button
        type="button"
        onClick={openCreateDialog}
        className="rounded-full bg-gradient-ember shadow-glow hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> Add booking
      </Button>
    </div>
  );
}

type BookingsDateFilterProps = Pick<AdminBookingsListState, "selectedDate" | "setSelectedDate">;

export function BookingsDateFilter({ selectedDate, setSelectedDate }: BookingsDateFilterProps) {
  if (!selectedDate) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>
        Showing bookings for{" "}
        <span className="font-medium text-foreground">
          {selectedDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </span>
      <button
        type="button"
        onClick={() => setSelectedDate(undefined)}
        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs hover:bg-secondary"
      >
        <X className="h-3 w-3" /> Clear
      </button>
    </div>
  );
}

type BookingsCalendarSectionProps = Pick<
  AdminBookingsListState,
  "bookings" | "selectedDate" | "setSelectedDate" | "calendarMonth" | "setCalendarMonth"
>;

export function BookingsCalendarSection({
  bookings,
  selectedDate,
  setSelectedDate,
  calendarMonth,
  setCalendarMonth,
}: BookingsCalendarSectionProps) {
  return (
    <section className="rounded-xl border border-ember/20 bg-card p-5 shadow-card sm:p-6">
      <BookingsCalendar
        bookings={bookings}
        selected={selectedDate}
        onSelect={setSelectedDate}
        month={calendarMonth}
        onMonthChange={setCalendarMonth}
      />
    </section>
  );
}

type BookingsTableProps = Pick<
  AdminBookingsListState,
  "bookings" | "filtered" | "statusFilter" | "setStatus" | "setDeleteTarget"
>;

export function BookingsTable({
  bookings,
  filtered,
  statusFilter,
  setStatus,
  setDeleteTarget,
}: BookingsTableProps) {
  const navigate = useNavigate();

  return (
    <section className="rounded-xl border border-border/60 bg-card shadow-card">
      <div className="border-b border-border/60 px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg">All bookings</h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length} booking{filtered.length === 1 ? "" : "s"}
          {statusFilter !== "all" ? ` · ${statusFilter.toLowerCase()}` : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="px-6 py-16 text-center text-muted-foreground">
          {bookings.length === 0
            ? "No booking requests yet."
            : "No bookings match the current filters."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Date & time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((booking) => (
              <TableRow
                key={booking.id}
                className="cursor-pointer hover:bg-secondary/40"
                onClick={() =>
                  void navigate({
                    to: "/admin/bookings/$bookingId",
                    params: { bookingId: booking.id },
                  })
                }
              >
                <TableCell>
                  <p className="font-medium">{booking.client_name}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {booking.phone_number ?? "—"}
                </TableCell>
                <TableCell>{booking.session_type}</TableCell>
                <TableCell>{formatBookingDateTime(booking.shoot_at)}</TableCell>
                <TableCell>
                  <StatusBadge status={booking.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    {booking.status === "Confirmed" && (
                      <button
                        type="button"
                        onClick={() => void setStatus(booking.id, "Completed")}
                        className="grid h-8 w-8 place-items-center rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                        title="Mark completed"
                      >
                        <CircleCheck className="h-4 w-4" />
                      </button>
                    )}
                    {booking.status !== "Confirmed" && booking.status !== "Completed" && (
                      <button
                        type="button"
                        onClick={() => void setStatus(booking.id, "Confirmed")}
                        className="grid h-8 w-8 place-items-center rounded-md bg-ember/15 text-ember hover:bg-ember/25"
                        title="Confirm"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {booking.status !== "Declined" && booking.status !== "Completed" && (
                      <button
                        type="button"
                        onClick={() => void setStatus(booking.id, "Declined")}
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Decline"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(booking)}
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
