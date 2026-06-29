import { describe, expect, it } from "vitest";

import { parseShootAt, validateBookingCoreFields } from "./booking-validation";

describe("parseShootAt", () => {
  it("rejects empty values", () => {
    expect(parseShootAt("   ")).toEqual({ error: "Shoot date and time are required." });
  });

  it("rejects invalid dates", () => {
    expect(parseShootAt("not-a-date")).toEqual({ error: "Invalid date or time." });
  });

  it("returns ISO string for valid input", () => {
    const result = parseShootAt("2025-06-15T14:30:00");
    expect(result).toEqual({ iso: new Date("2025-06-15T14:30:00").toISOString() });
  });
});

describe("validateBookingCoreFields", () => {
  it("returns field errors in order", () => {
    expect(validateBookingCoreFields({ client_name: "", session_type: "", shoot_at: "" })).toEqual({
      error: "Name is required.",
    });
  });

  it("validates session type after name", () => {
    expect(
      validateBookingCoreFields({
        client_name: "Alex",
        session_type: "  ",
        shoot_at: "2025-06-15T14:30:00",
      }),
    ).toEqual({ error: "Session type is required." });
  });

  it("returns normalized values when valid", () => {
    expect(
      validateBookingCoreFields({
        client_name: " Alex ",
        session_type: " Portrait session ",
        shoot_at: "2025-06-15T14:30:00",
      }),
    ).toEqual({
      clientName: "Alex",
      sessionType: "Portrait session",
      shootAtIso: new Date("2025-06-15T14:30:00").toISOString(),
    });
  });
});
