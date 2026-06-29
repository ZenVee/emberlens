import type { getSupabaseServerClient } from "./supabase";

type Supabase = ReturnType<typeof getSupabaseServerClient>;

export type SyncResult = { error: string | null };

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
): Promise<SyncResult> {
  const { error } = await supabase
    .from("projects")
    .update({
      client_paid_at: clientPaidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function syncProjectPaidToBookings(
  supabase: Supabase,
  projectId: string,
  clientPaidAt: string | null,
): Promise<SyncResult> {
  const { error } = await supabase
    .from("bookings")
    .update({
      client_paid_at: clientPaidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId);
  if (error) return { error: error.message };
  return { error: null };
}
