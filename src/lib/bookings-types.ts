export const BOOKING_STATUSES = ["Pending", "Confirmed", "Declined", "Completed"] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type DbBooking = {
  id: string;
  client_name: string;
  session_type: string;
  shoot_at: string;
  phone_number: string | null;
  notes: string | null;
  status: BookingStatus;
  project_id: string | null;
  client_paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export function formatBookingDateTime(shootAt: string): string {
  const date = new Date(shootAt);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBookingTime(shootAt: string): string {
  const date = new Date(shootAt);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function bookingDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function bookingDateKeyFromIso(shootAt: string): string {
  return bookingDateKey(new Date(shootAt));
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  return buildDatetimeLocal(date, date.getHours(), date.getMinutes());
}

export function buildDatetimeLocal(date: Date, hours: number, minutes: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return `${year}-${month}-${day}T${h}:${m}`;
}

export function parseDatetimeLocalValue(
  value: string,
): { date: Date; hours: number; minutes: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    hours: parsed.getHours(),
    minutes: parsed.getMinutes(),
  };
}

export function formatDatetimeLocalLabel(value: string): string | null {
  const parts = parseDatetimeLocalValue(value);
  if (!parts) return null;

  const dateLabel = parts.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = new Date(
    parts.date.getFullYear(),
    parts.date.getMonth(),
    parts.date.getDate(),
    parts.hours,
    parts.minutes,
  ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return `${dateLabel} · ${timeLabel}`;
}

export function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}

/** @deprecated Use formatBookingDateTime */
export function formatBookingDate(shootAt: string): string {
  return formatBookingDateTime(shootAt);
}
