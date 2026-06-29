import { describe, expect, it } from "vitest";

import { bookingCoreFormSchema } from "./booking-form";

describe("bookingCoreFormSchema", () => {
  it("accepts valid booking form values", () => {
    expect(
      bookingCoreFormSchema.parse({
        client_name: "Alex",
        session_type: "Portrait",
        shoot_at: "2025-06-15T14:30",
        phone_number: "555-0100",
        notes: "Outdoor",
      }),
    ).toMatchObject({ client_name: "Alex" });
  });

  it("rejects empty client name", () => {
    expect(() =>
      bookingCoreFormSchema.parse({
        client_name: "  ",
        session_type: "Portrait",
        shoot_at: "2025-06-15T14:30",
        phone_number: "",
        notes: "",
      }),
    ).toThrow(/Name is required/);
  });

  it("rejects missing shoot date", () => {
    expect(() =>
      bookingCoreFormSchema.parse({
        client_name: "Alex",
        session_type: "Portrait",
        shoot_at: "",
        phone_number: "",
        notes: "",
      }),
    ).toThrow(/Shoot date and time are required/);
  });
});
