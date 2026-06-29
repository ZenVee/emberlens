import { describe, expect, it, beforeEach } from "vitest";

import {
  BOOKING_RATE_LIMIT,
  bookingRateLimitError,
  checkInMemoryRateLimit,
  getBookingRateLimitKey,
  resetBookingRateLimitStore,
} from "./booking-rate-limit";

describe("getBookingRateLimitKey", () => {
  it("uses ip when present", () => {
    expect(getBookingRateLimitKey("203.0.113.1")).toBe("203.0.113.1");
  });

  it("falls back for missing ip", () => {
    expect(getBookingRateLimitKey(undefined)).toBe("unknown");
    expect(getBookingRateLimitKey("  ")).toBe("unknown");
  });
});

describe("checkInMemoryRateLimit", () => {
  beforeEach(() => {
    resetBookingRateLimitStore();
  });

  it("allows requests under the limit", () => {
    const config = { maxRequests: 2, windowMs: 60_000 };
    expect(checkInMemoryRateLimit("a", 0, config)).toEqual({ allowed: true });
    expect(checkInMemoryRateLimit("a", 1_000, config)).toEqual({ allowed: true });
  });

  it("blocks after the limit within the window", () => {
    const config = { maxRequests: 2, windowMs: 60_000 };
    checkInMemoryRateLimit("a", 0, config);
    checkInMemoryRateLimit("a", 1_000, config);
    expect(checkInMemoryRateLimit("a", 2_000, config)).toEqual({
      allowed: false,
      retryAfterMs: 58_000,
    });
  });

  it("resets after the window expires", () => {
    const config = { maxRequests: 1, windowMs: 60_000 };
    checkInMemoryRateLimit("a", 0, config);
    expect(checkInMemoryRateLimit("a", 60_001, config)).toEqual({ allowed: true });
  });

  it("tracks keys independently", () => {
    checkInMemoryRateLimit("a", 0, BOOKING_RATE_LIMIT);
    expect(checkInMemoryRateLimit("b", 0, BOOKING_RATE_LIMIT)).toEqual({ allowed: true });
  });
});

describe("bookingRateLimitError", () => {
  it("rounds retry time up to minutes", () => {
    expect(bookingRateLimitError(90_000)).toMatch(/2 minutes/);
    expect(bookingRateLimitError(30_000)).toMatch(/1 minute/);
  });
});
