import { getSupabaseServerClient } from "./supabase";

export async function requireAdmin() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile?.is_admin) {
    throw new Error("Admin access required.");
  }

  return { supabase, user };
}
