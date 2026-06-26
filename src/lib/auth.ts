import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import type { User } from "@supabase/supabase-js";

import { profileNeedsOnboarding, syncProfileForUser, type Profile } from "./profile";
import { getSupabaseServerClient } from "./supabase";

export type AuthUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  needsOnboarding: boolean;
};

function toAuthUser(user: User, profile: Profile): AuthUser {
  const needsOnboarding = profileNeedsOnboarding(profile);

  return {
    id: user.id,
    name: profile.display_name?.trim() || "Studio",
    avatarUrl: profile.avatar_url,
    isAdmin: profile.is_admin,
    needsOnboarding,
  };
}

export const fetchUser = createServerFn({ method: "GET" }).handler(async (): Promise<AuthUser | null> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const profile = await syncProfileForUser(supabase, data.user);
  return toAuthUser(data.user, profile);
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

  if (!code) {
    return { error: "Missing authorization code", next: "/admin/login" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return { error: error.message, next: "/admin/login" };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: userError?.message ?? "Could not load user.", next: "/admin/login" };
  }

  const profile = await syncProfileForUser(supabase, user);

  if (!profile.is_admin) {
    await supabase.auth.signOut();
    return { error: "You do not have studio admin access.", next: "/admin/login" };
  }

  const next = profileNeedsOnboarding(profile) ? "/admin/onboarding" : "/admin";

  return { error: null, next };
});
