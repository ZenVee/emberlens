import { getRequestIP } from "@tanstack/react-start/server";

import {
  bookingRateLimitError,
  checkInMemoryRateLimit,
  getBookingRateLimitKey,
} from "./booking-rate-limit";

export function assertPublicBookingRateLimit(): { error: string | null } {
  const ip = getRequestIP({ xForwardedFor: true });
  const result = checkInMemoryRateLimit(getBookingRateLimitKey(ip));

  if (!result.allowed) {
    return { error: bookingRateLimitError(result.retryAfterMs) };
  }

  return { error: null };
}
