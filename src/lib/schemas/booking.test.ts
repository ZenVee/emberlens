import { describe, expect, it } from "vitest";

import { BOOKING_STATUSES } from "../bookings-types";
import { createBookingSchema, updateBookingStatusSchema } from "./booking";

describe("createBookingSchema", () => {
  it("accepts valid booking input", () => {
    expect(
      createBookingSchema.parse({
        client_name: "Alex",
        session_type: "Portrait session",
        shoot_at: "2025-06-15T14:30:00",
        phone_number: "555-0100",
        notes: "Outdoor shoot",
      }),
    ).toMatchObject({ client_name: "Alex" });
  });

  it("rejects missing required fields", () => {
    expect(() => createBookingSchema.parse({ client_name: "Alex" })).toThrow();
  });
});

describe("updateBookingStatusSchema", () => {
  it("accepts valid status values", () => {
    for (const status of BOOKING_STATUSES) {
      expect(updateBookingStatusSchema.parse({ id: "booking-1", status })).toEqual({
        id: "booking-1",
        status,
      });
    }
  });

  it("rejects invalid status", () => {
    expect(() =>
      updateBookingStatusSchema.parse({ id: "booking-1", status: "Cancelled" }),
    ).toThrow();
  });
});
