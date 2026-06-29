import {
  bookingDateKey,
  parseDatetimeLocalValue,
  toDatetimeLocalValue,
  type BookingStatus,
  type DbBooking,
} from "./bookings-types";
import type { BookingEditorFieldsValues } from "./schemas/booking-form";

export const NO_PROJECT = "__none__";

export type CreateProjectForm = {
  title: string;
  client: string;
  description: string;
  category: string;
  shoot_date: string;
};

export type BookingForm = {
  client_name: string;
  phone_number: string;
  session_type: string;
  shoot_at: string;
  notes: string;
  status: BookingStatus;
  project_id: string | null;
  client_paid_at: string | null;
};

export function toBookingEditorFields(booking: DbBooking): BookingEditorFieldsValues {
  const form = toBookingForm(booking);
  return {
    client_name: form.client_name,
    phone_number: form.phone_number,
    session_type: form.session_type,
    shoot_at: form.shoot_at,
    notes: form.notes,
    project_id: form.project_id,
    client_paid_at: form.client_paid_at,
  };
}

export function toBookingForm(booking: DbBooking): BookingForm {
  return {
    client_name: booking.client_name,
    phone_number: booking.phone_number ?? "",
    session_type: booking.session_type,
    shoot_at: toDatetimeLocalValue(booking.shoot_at),
    notes: booking.notes ?? "",
    status: booking.status,
    project_id: booking.project_id,
    client_paid_at: booking.client_paid_at,
  };
}

export function buildProjectDraftFromBooking(
  booking: BookingForm,
  defaultCategory?: string,
): CreateProjectForm {
  const parsed = parseDatetimeLocalValue(booking.shoot_at);
  const title = [booking.client_name, booking.session_type].filter(Boolean).join(" — ");

  return {
    title,
    client: booking.client_name,
    description: booking.notes,
    category: defaultCategory ?? "Portrait",
    shoot_date: parsed ? bookingDateKey(parsed.date) : "",
  };
}

export function emptyAdminBookingForm(defaultSessionType: string) {
  return {
    client_name: "",
    phone_number: "",
    session_type: defaultSessionType,
    shoot_at: "",
    notes: "",
  };
}

export type AdminBookingCreateForm = ReturnType<typeof emptyAdminBookingForm>;

export function parseShootDisplayParts(shootAt: string) {
  const parsed = parseDatetimeLocalValue(shootAt);
  if (!parsed) return null;

  return {
    weekday: parsed.date.toLocaleDateString("en-US", { weekday: "long" }),
    month: parsed.date.toLocaleDateString("en-US", { month: "short" }),
    day: parsed.date.getDate(),
    year: parsed.date.getFullYear(),
    time: new Date(
      parsed.date.getFullYear(),
      parsed.date.getMonth(),
      parsed.date.getDate(),
      parsed.hours,
      parsed.minutes,
    ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}
