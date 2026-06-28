import type { getSupabaseServerClient } from "./supabase";

type Supabase = ReturnType<typeof getSupabaseServerClient>;

export function mergePaidOnLink(
  bookingPaidAt: string | null,
  projectPaidAt: string | null,
): string | null {
  if (bookingPaidAt && projectPaidAt) return projectPaidAt;
  return bookingPaidAt ?? projectPaidAt;
}

export async function syncBookingPaidToProject(
  supabase: Supabase,
  projectId: string,
  clientPaidAt: string | null,
) {
  const patch: Record<string, unknown> = {
    client_paid_at: clientPaidAt,
    updated_at: new Date().toISOString(),
  };
  if (clientPaidAt === null) {
    patch.public_watermarked = false;
  }
  await supabase.from("projects").update(patch).eq("id", projectId);
}

export async function syncProjectPaidToBookings(
  supabase: Supabase,
  projectId: string,
  clientPaidAt: string | null,
) {
  await supabase
    .from("bookings")
    .update({
      client_paid_at: clientPaidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId);
}
