import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { AdminFormDialog } from "@/components/admin/admin-form-dialog";
import { BookingCoreFields } from "@/components/admin/bookings/booking-core-fields";
import { Form } from "@/components/ui/form";
import { categorySelectOptions } from "@/lib/categories";
import { useCreateAdminBookingMutation } from "@/lib/mutations/bookings";
import { mutationErrorMessage } from "@/lib/mutations/shared";
import {
  bookingCoreFormSchema,
  emptyBookingCoreForm,
  type BookingCoreFormValues,
} from "@/lib/schemas/booking-form";

type CreateBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTypes: readonly string[];
  defaultSessionType: string;
};

export function CreateBookingDialog({
  open,
  onOpenChange,
  sessionTypes,
  defaultSessionType,
}: CreateBookingDialogProps) {
  const createMutation = useCreateAdminBookingMutation();
  const { reset: resetCreateMutation } = createMutation;
  const form = useForm<BookingCoreFormValues>({
    resolver: zodResolver(bookingCoreFormSchema),
    defaultValues: emptyBookingCoreForm(defaultSessionType),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(emptyBookingCoreForm(defaultSessionType));
    resetCreateMutation();
  }, [open, defaultSessionType, form, resetCreateMutation]);

  const sessionType = form.watch("session_type");
  const sessionTypeOptions = useMemo(
    () => categorySelectOptions(sessionTypes, sessionType),
    [sessionTypes, sessionType],
  );

  async function onSubmit(values: BookingCoreFormValues) {
    try {
      await createMutation.mutateAsync(values);
      onOpenChange(false);
    } catch {
      // mutation error surfaced via createMutation.isError — use form-level display below
    }
  }

  const submitError = createMutation.isError
    ? mutationErrorMessage(createMutation.error, "Could not create booking.")
    : null;

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add booking"
      description="Manually add a session to the calendar."
      submitLabel="Add booking"
      submitting={createMutation.isPending}
      error={submitError}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Form {...form}>
        <BookingCoreFields control={form.control} sessionTypeOptions={sessionTypeOptions} />
      </Form>
    </AdminFormDialog>
  );
}
