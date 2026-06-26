export function getSupabaseUrl() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }
  return url;
}

export function getSupabasePublishableKey() {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY");
  }
  return key;
}
