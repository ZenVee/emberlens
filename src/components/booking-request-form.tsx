import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { BookingCoreFields } from "@/components/admin/bookings/booking-core-fields";
import { Form } from "@/components/ui/form";
import { categorySelectOptions, DEFAULT_SESSION_TYPES } from "@/lib/categories";
import { createBooking } from "@/lib/bookings";
import {
  bookingCoreFormSchema,
  emptyBookingCoreForm,
  type BookingCoreFormValues,
} from "@/lib/schemas/booking-form";

type BookingRequestFormProps = {
  sessionTypes: readonly string[];
};

export function BookingRequestForm({ sessionTypes }: BookingRequestFormProps) {
  const createFn = useServerFn(createBooking);
  const defaultSessionType = sessionTypes[0] ?? DEFAULT_SESSION_TYPES[0];
  const form = useForm<BookingCoreFormValues>({
    resolver: zodResolver(bookingCoreFormSchema),
    defaultValues: emptyBookingCoreForm(defaultSessionType),
  });

  const sessionType = form.watch("session_type");
  const sessionTypeOptions = useMemo(
    () => categorySelectOptions(sessionTypes, sessionType),
    [sessionTypes, sessionType],
  );

  async function onSubmit(values: BookingCoreFormValues) {
    try {
      const result = await createFn({ data: values });
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Request sent! We'll get back to you soon.");
      form.reset(emptyBookingCoreForm(defaultSessionType));
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="contents [&_label]:sr-only [&_input]:rounded-xl [&_input]:border [&_input]:border-border [&_input]:bg-background/60 [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-background/60 [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-sm">
          <BookingCoreFields
            control={form.control}
            sessionTypeOptions={sessionTypeOptions}
            datetimeId="public-booking-datetime"
            fullWidthFields
          />
        </div>
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-ember px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60 sm:col-span-2"
        >
          <Mail className="h-4 w-4" /> {form.formState.isSubmitting ? "Sending…" : "Send request"}
        </button>
      </form>
    </Form>
  );
}
