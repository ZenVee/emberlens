import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Plus, Trash2, X, CircleCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { useAdminPageMeta } from "@/components/admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { AppSelect } from "@/components/app-select";
import { BookingDateTimePicker } from "@/components/booking-datetime-picker";
import { BookingsCalendar } from "@/components/bookings-calendar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAdminBookings, useAdminSiteSettings } from "@/lib/admin-queries";
import {
  categorySelectOptions,
  DEFAULT_SESSION_TYPES,
} from "@/lib/categories";
import {
  bookingDateKey,
  bookingDateKeyFromIso,
  formatBookingDateTime,
  type BookingStatus,
  type DbBooking,
} from "@/lib/bookings-types";
import {
  createAdminBooking,
  deleteBooking,
  updateBookingStatus,
} from "@/lib/bookings";
import { patchBookingInCache } from "@/lib/booking-cache";
import { adminBookingsQueryKey } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | BookingStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Completed", label: "Completed" },
  { value: "Declined", label: "Declined" },
];

function emptyBookingForm(defaultSessionType: string) {
  return {
    client_name: "",
    phone_number: "",
    session_type: defaultSessionType,
    shoot_at: "",
    notes: "",
  };
}

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
  const navigate = useNavigate();
  const { data: bookings = [], isPending, isError, error: loadError } = useAdminBookings();
  const { data: settings } = useAdminSiteSettings();
  const queryClient = useQueryClient();
  const updateStatusFn = useServerFn(updateBookingStatus);
  const createFn = useServerFn(createAdminBooking);
  const deleteFn = useServerFn(deleteBooking);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbBooking | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => emptyBookingForm(DEFAULT_SESSION_TYPES[0]));

  const sessionTypes = settings?.session_types ?? [...DEFAULT_SESSION_TYPES];
  const defaultSessionType = sessionTypes[0] ?? DEFAULT_SESSION_TYPES[0];
  const sessionTypeOptions = useMemo(
    () => categorySelectOptions(sessionTypes, form.session_type),
    [sessionTypes, form.session_type],
  );

  const pendingCount = bookings.filter((b) => b.status === "Pending").length;

  useAdminPageMeta({
    title: "Bookings",
    subtitle:
      bookings.length === 0
        ? "No booking requests yet"
        : `${pendingCount} pending · ${bookings.length} total`,
  });

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) return false;
      if (selectedDate && bookingDateKeyFromIso(booking.shoot_at) !== bookingDateKey(selectedDate)) {
        return false;
      }
      return true;
    });
  }, [bookings, statusFilter, selectedDate]);

  function updateBookings(updater: (prev: DbBooking[]) => DbBooking[]) {
    queryClient.setQueryData(adminBookingsQueryKey, (prev: DbBooking[] | undefined) =>
      updater(prev ?? []),
    );
  }

  async function setStatus(id: string, status: BookingStatus) {
    setError(null);
    const result = await updateStatusFn({ data: { id, status } });
    if (result.error) {
      setError(result.error);
      return;
    }
    patchBookingInCache(queryClient, id, { status });
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    const result = await createFn({ data: form });
    setSaving(false);
    if (result.error || !result.booking) {
      setError(result.error ?? "Could not create booking.");
      return;
    }
    updateBookings((prev) =>
      [...prev, result.booking!].sort(
        (a, b) => new Date(a.shoot_at).getTime() - new Date(b.shoot_at).getTime(),
      ),
    );
    setCreateOpen(false);
    setForm(emptyBookingForm(defaultSessionType));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    const result = await deleteFn({ data: { id: deleteTarget.id } });
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    updateBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  if (isPending) return <AdminLoading variant="table" />;
  if (isError) {
    return (
      <p className="rounded-2xl border border-destructive/40 bg-destructive/5 px-6 py-16 text-center text-destructive">
        {loadError instanceof Error ? loadError.message : "Could not load bookings."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
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
          onClick={() => {
            setForm(emptyBookingForm(defaultSessionType));
            setCreateOpen(true);
          }}
          className="rounded-full bg-gradient-ember shadow-glow hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add booking
        </Button>
      </div>

      {selectedDate && (
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
      )}

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-ember/20 bg-card p-5 shadow-card sm:p-6">
        <BookingsCalendar
          bookings={bookings}
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
        />
      </section>

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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add booking</DialogTitle>
            <DialogDescription>Manually add a session to the calendar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-name">Client name</Label>
              <Input
                id="booking-name"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-phone">Phone number</Label>
              <Input
                id="booking-phone"
                type="tel"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Session type</Label>
              <AppSelect
                value={form.session_type}
                onValueChange={(value) => setForm({ ...form, session_type: value })}
                options={sessionTypeOptions}
              />
            </div>
            <BookingDateTimePicker
              id="booking-datetime"
              value={form.shoot_at}
              onChange={(shoot_at) => setForm({ ...form, shoot_at })}
            />
            <div className="space-y-2">
              <Label htmlFor="booking-notes">Notes</Label>
              <Textarea
                id="booking-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              className="bg-gradient-ember shadow-glow hover:opacity-90"
              onClick={() => void handleCreate()}
            >
              {saving ? "Saving…" : "Add booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Delete booking"
        description={
          deleteTarget
            ? `Delete the booking for ${deleteTarget.client_name} on ${formatBookingDateTime(deleteTarget.shoot_at)}?`
            : "Delete this booking?"
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
