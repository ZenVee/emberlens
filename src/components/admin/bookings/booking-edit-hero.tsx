import { CalendarDays, Camera, Clock, Phone } from "lucide-react";

import { StatusPicker } from "@/components/admin/bookings/booking-edit-primitives";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { BookingEditorState } from "@/hooks/admin/use-booking-editor";

type BookingEditHeroProps = Pick<
  BookingEditorState,
  "fieldsForm" | "bookingStatus" | "shootParts" | "handleStatusChange"
>;

export function BookingEditHero({
  fieldsForm,
  bookingStatus,
  shootParts,
  handleStatusChange,
}: BookingEditHeroProps) {
  const sessionType = fieldsForm.watch("session_type");
  const phoneNumber = fieldsForm.watch("phone_number");

  return (
    <header className="relative overflow-hidden rounded-3xl border border-ember/25 bg-gradient-night shadow-card">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ember/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-blush/10 blur-3xl" />

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-ember">
            Session booking
          </p>
          <FormField
            control={fieldsForm.control}
            name="client_name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Client name"
                    className="h-auto border-0 bg-transparent p-0 font-display text-3xl font-medium shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 sm:text-4xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1">
              <Camera className="h-3.5 w-3.5 text-ember" />
              {sessionType || "Session type"}
            </span>
            {phoneNumber ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1">
                <Phone className="h-3.5 w-3.5 text-ember" />
                {phoneNumber}
              </span>
            ) : null}
          </div>
        </div>

        {shootParts ? (
          <div className="flex items-stretch gap-3 sm:gap-4">
            <div className="flex min-w-[5.5rem] flex-col items-center justify-center rounded-2xl border border-ember/30 bg-card/60 px-4 py-3 text-center shadow-glow">
              <span className="text-xs font-medium uppercase tracking-wider text-ember">
                {shootParts.month}
              </span>
              <span className="font-display text-4xl leading-none">{shootParts.day}</span>
              <span className="mt-1 text-xs text-muted-foreground">{shootParts.year}</span>
            </div>
            <div className="flex flex-col justify-center gap-1">
              <p className="font-medium">{shootParts.weekday}</p>
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-ember" />
                {shootParts.time}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-ember/30 bg-card/30 px-5 py-4 text-sm text-muted-foreground">
            <CalendarDays className="h-5 w-5 text-ember" />
            Pick a shoot date below
          </div>
        )}
      </div>

      <div className="relative border-t border-ember/15 px-6 py-4 sm:px-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Booking status
        </p>
        <StatusPicker value={bookingStatus} onChange={handleStatusChange} />
      </div>
    </header>
  );
}
