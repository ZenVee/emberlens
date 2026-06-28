import { createServerFn } from "@tanstack/react-start";

import { requireAdmin } from "./admin";
import { isAllowedCategory } from "./categories";
import { loadSiteSettings } from "./site-settings-data";
import { mergePaidOnLink, syncBookingPaidToProject } from "./paid-sync";
import { isBookingStatus, type BookingStatus, type DbBooking } from "./bookings-types";
import { getSupabaseServerClient } from "./supabase";

const BOOKING_SELECT =
  "id, client_name, session_type, shoot_at, phone_number, notes, status, project_id, client_paid_at, created_at, updated_at";

async function resolveProjectId(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  projectId: string | null | undefined,
): Promise<string | null | { error: string }> {
  const id = projectId?.trim();
  if (!id) return null;

  const { data, error } = await supabase.from("projects").select("id").eq("id", id).maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Project not found." };
  return id;
}

function parseShootAt(value: string): { iso: string } | { error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { error: "Shoot date and time are required." };

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { error: "Invalid date or time." };
  }

  return { iso: parsed.toISOString() };
}

export const fetchAdminBookings = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbBooking[]> => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .order("shoot_at", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as DbBooking[];
  },
);

export const createBooking = createServerFn({ method: "POST" })
  .validator(
    (data: {
      client_name: string;
      session_type: string;
      shoot_at: string;
      phone_number?: string;
      notes?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const clientName = data.client_name.trim();
    const sessionType = data.session_type.trim();
    const shootAt = parseShootAt(data.shoot_at);

    if (clientName.length < 1) return { error: "Name is required.", booking: null };
    if (sessionType.length < 1) return { error: "Session type is required.", booking: null };
    if ("error" in shootAt) return { error: shootAt.error, booking: null };

    const settings = await loadSiteSettings();
    if (!isAllowedCategory(sessionType, settings.session_types)) {
      return { error: "Invalid session type.", booking: null };
    }

    const supabase = getSupabaseServerClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        client_name: clientName,
        session_type: sessionType,
        shoot_at: shootAt.iso,
        phone_number: data.phone_number?.trim() || null,
        notes: data.notes?.trim() || null,
        status: "Pending",
      })
      .select(BOOKING_SELECT)
      .single();

    if (error) return { error: error.message, booking: null };
    return { error: null, booking: booking as DbBooking };
  });

export const createAdminBooking = createServerFn({ method: "POST" })
  .validator(
    (data: {
      client_name: string;
      session_type: string;
      shoot_at: string;
      phone_number?: string;
      notes?: string;
      status?: BookingStatus;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const clientName = data.client_name.trim();
    const sessionType = data.session_type.trim();
    const shootAt = parseShootAt(data.shoot_at);
    const status = data.status ?? "Pending";

    if (clientName.length < 1) return { error: "Name is required.", booking: null };
    if (sessionType.length < 1) return { error: "Session type is required.", booking: null };
    if ("error" in shootAt) return { error: shootAt.error, booking: null };
    if (!isBookingStatus(status)) return { error: "Invalid status.", booking: null };

    const settings = await loadSiteSettings();
    if (!isAllowedCategory(sessionType, settings.session_types)) {
      return { error: "Invalid session type.", booking: null };
    }

    const supabase = getSupabaseServerClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        client_name: clientName,
        session_type: sessionType,
        shoot_at: shootAt.iso,
        phone_number: data.phone_number?.trim() || null,
        notes: data.notes?.trim() || null,
        status,
      })
      .select(BOOKING_SELECT)
      .single();

    if (error) return { error: error.message, booking: null };
    return { error: null, booking: booking as DbBooking };
  });

export const updateBookingStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: BookingStatus }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!isBookingStatus(data.status)) return { error: "Invalid status." };

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);

    if (error) return { error: error.message };
    return { error: null };
  });

export const deleteBooking = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("bookings").delete().eq("id", data.id);
    if (error) return { error: error.message };
    return { error: null };
  });

export const fetchAdminBooking = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<DbBooking | null> => {
    await requireAdmin();
    const supabase = getSupabaseServerClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw error;
    return booking as DbBooking | null;
  });

export const updateBooking = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      client_name: string;
      session_type: string;
      shoot_at: string;
      phone_number?: string;
      notes?: string;
      status: BookingStatus;
      project_id?: string | null;
      client_paid_at?: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const clientName = data.client_name.trim();
    const sessionType = data.session_type.trim();
    const shootAt = parseShootAt(data.shoot_at);
    const status = data.status;

    if (clientName.length < 1) return { error: "Name is required.", booking: null };
    if (sessionType.length < 1) return { error: "Session type is required.", booking: null };
    if ("error" in shootAt) return { error: shootAt.error, booking: null };
    if (!isBookingStatus(status)) return { error: "Invalid status.", booking: null };

    const supabase = getSupabaseServerClient();
    const projectResult = await resolveProjectId(supabase, data.project_id);
    if (projectResult !== null && typeof projectResult === "object") {
      return { error: projectResult.error, booking: null };
    }
    const resolvedProjectId = typeof projectResult === "string" ? projectResult : null;

    const settings = await loadSiteSettings();
    const { data: existing } = await supabase
      .from("bookings")
      .select("session_type, project_id, client_paid_at")
      .eq("id", data.id)
      .maybeSingle();

    const allowedSessionTypes = [...settings.session_types];
    const existingType = existing?.session_type?.trim();
    if (existingType && !allowedSessionTypes.includes(existingType)) {
      allowedSessionTypes.push(existingType);
    }

    if (!isAllowedCategory(sessionType, allowedSessionTypes)) {
      return { error: "Invalid session type.", booking: null };
    }

    const projectIdChanged = existing?.project_id !== resolvedProjectId;
    let clientPaidAt =
      data.client_paid_at !== undefined
        ? data.client_paid_at
        : (existing?.client_paid_at as string | null | undefined) ?? null;

    if (projectIdChanged && resolvedProjectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("client_paid_at")
        .eq("id", resolvedProjectId)
        .maybeSingle();
      clientPaidAt = mergePaidOnLink(clientPaidAt, (project?.client_paid_at as string | null) ?? null);
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .update({
        client_name: clientName,
        session_type: sessionType,
        shoot_at: shootAt.iso,
        phone_number: data.phone_number?.trim() || null,
        notes: data.notes?.trim() || null,
        status,
        project_id: resolvedProjectId,
        client_paid_at: clientPaidAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select(BOOKING_SELECT)
      .single();

    if (error) return { error: error.message, booking: null };

    if (resolvedProjectId) {
      await syncBookingPaidToProject(supabase, resolvedProjectId, clientPaidAt);
    }

    return { error: null, booking: booking as DbBooking };
  });
