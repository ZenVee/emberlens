export function parseShootAt(value: string): { iso: string } | { error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { error: "Shoot date and time are required." };

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { error: "Invalid date or time." };
  }

  return { iso: parsed.toISOString() };
}

export type BookingCoreInput = {
  client_name: string;
  session_type: string;
  shoot_at: string;
};

export type ValidatedBookingCore = {
  clientName: string;
  sessionType: string;
  shootAtIso: string;
};

export function validateBookingCoreFields(
  input: BookingCoreInput,
): { error: string } | ValidatedBookingCore {
  const clientName = input.client_name.trim();
  const sessionType = input.session_type.trim();
  const shootAt = parseShootAt(input.shoot_at);

  if (clientName.length < 1) return { error: "Name is required." };
  if (sessionType.length < 1) return { error: "Session type is required." };
  if ("error" in shootAt) return { error: shootAt.error };

  return { clientName, sessionType, shootAtIso: shootAt.iso };
}
