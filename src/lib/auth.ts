import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import type { User } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "./supabase";

export type AuthUser = {
  id: string;
  email: string | undefined;
  name: string;
  avatarUrl: string | null;
};

function toAuthUser(user: User): AuthUser {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    name:
      (metadata.full_name as string | undefined) ??
      (metadata.name as string | undefined) ??
      (metadata.user_name as string | undefined) ??
      user.email ??
      "Studio",
    avatarUrl: (metadata.avatar_url as string | undefined) ?? null,
  };
}

export const fetchUser = createServerFn({ method: "GET" }).handler(async (): Promise<AuthUser | null> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return toAuthUser(data.user);
});

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
});

export const handleAuthCallback = createServerFn({ method: "GET" }).handler(async () => {
  const url = getRequestUrl();
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";

  if (!code) {
    return { error: "Missing authorization code", next: "/admin/login" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return { error: error.message, next: "/admin/login" };
  }

  return { error: null, next };
});
