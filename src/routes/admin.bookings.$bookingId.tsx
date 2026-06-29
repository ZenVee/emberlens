import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { BookingEditBody } from "@/components/admin/bookings/booking-edit-body";
import { BookingEditHero } from "@/components/admin/bookings/booking-edit-hero";
import { CreateProjectDialog } from "@/components/admin/bookings/create-project-dialog";
import { useAdminPageMeta } from "@/components/use-admin-page-meta";
import { AdminLoading } from "@/components/admin-loading";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Form } from "@/components/ui/form";
import { useAdminBooking } from "@/lib/admin-queries";
import { formatBookingDateTime, type DbBooking } from "@/lib/bookings-types";
import { useBookingEditor } from "@/hooks/admin/use-booking-editor";

export const Route = createFileRoute("/admin/bookings/$bookingId")({
  head: () => ({ meta: [{ title: "Edit Booking — Ember Lens Studio" }] }),
  component: AdminBookingEdit,
  notFoundComponent: BookingNotFound,
});

function BookingNotFound() {
  useAdminPageMeta({ title: "Booking not found" });
  return (
    <Link to="/admin/bookings" className="text-sm text-ember hover:underline">
      Back to bookings
    </Link>
  );
}

function AdminBookingEdit() {
  const { bookingId } = useParams({ from: "/admin/bookings/$bookingId" });
  const { data: booking, isPending, isError } = useAdminBooking(bookingId);

  useAdminPageMeta({
    title: booking?.client_name ?? "Edit booking",
    subtitle: booking ? formatBookingDateTime(booking.shoot_at) : "Booking details",
  });

  if (!isPending && (isError || booking === null)) {
    throw notFound();
  }

  if (isPending || !booking || booking.id !== bookingId) {
    return (
      <>
        <Link
          to="/admin/bookings"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Back to bookings
        </Link>
        <AdminLoading variant="form" />
      </>
    );
  }

  return <BookingEditForm key={bookingId} initial={booking} />;
}

function BookingEditForm({ initial }: { initial: DbBooking }) {
  const editor = useBookingEditor(initial);

  return (
    <Form {...editor.fieldsForm}>
      <div>
        <Link
          to="/admin/bookings"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All bookings
        </Link>

        {(editor.error || editor.saveError) && (
          <p className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {editor.error ?? editor.saveError}
          </p>
        )}

        <BookingEditHero
          fieldsForm={editor.fieldsForm}
          bookingStatus={editor.bookingStatus}
          shootParts={editor.shootParts}
          handleStatusChange={editor.handleStatusChange}
        />

        <BookingEditBody {...editor} />

        <ConfirmDialog
          open={editor.deleteOpen}
          onOpenChange={(open) => {
            if (!open && !editor.deleting) editor.setDeleteOpen(false);
          }}
          title="Delete booking"
          description={`Delete the booking for ${editor.fieldsForm.getValues("client_name")} on ${formatBookingDateTime(editor.fieldsForm.getValues("shoot_at") || initial.shoot_at)}?`}
          confirmLabel="Delete"
          destructive
          loading={editor.deleting}
          onConfirm={editor.confirmDelete}
        />

        <CreateProjectDialog
          open={editor.createOpen}
          onOpenChange={editor.setCreateOpen}
          defaultValues={editor.projectDraft}
          projectCategoryOptions={editor.projectCategoryOptions}
          creating={editor.creating}
          createError={editor.createError}
          onSubmit={editor.handleCreateProject}
        />
      </div>
    </Form>
  );
}
