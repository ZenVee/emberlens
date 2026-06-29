export const BOOKING_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
} as const;

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const store = new Map<string, RateLimitEntry>();

export function resetBookingRateLimitStore() {
  store.clear();
}

export function getBookingRateLimitKey(ip: string | undefined | null): string {
  const trimmed = ip?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "unknown";
}

export function checkInMemoryRateLimit(
  key: string,
  now = Date.now(),
  config: { maxRequests: number; windowMs: number } = BOOKING_RATE_LIMIT,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= config.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      retryAfterMs: config.windowMs - (now - entry.windowStart),
    };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true };
}

export function bookingRateLimitError(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  return `Too many booking requests. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
