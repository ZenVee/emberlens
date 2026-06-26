import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "./supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
};

function discordAvatarUrl(user: User): string | null {
  const metadata = user.user_metadata ?? {};
  const avatar = metadata.avatar_url as string | undefined;
  return avatar ?? null;
}

export function profileNeedsOnboarding(profile: Pick<Profile, "display_name">) {
  return !profile.display_name?.trim();
}

export async function syncProfileForUser(supabase: SupabaseClient, user: User): Promise<Profile> {
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: null,
      avatar_url: discordAvatarUrl(user),
    })
    .select("id, display_name, avatar_url, is_admin")
    .single();

  if (insertError) {
    throw insertError;
  }

  return created;
}

export const updateDisplayName = createServerFn({ method: "POST" })
  .validator((data: { displayName: string }) => data)
  .handler(async ({ data }) => {
    const displayName = data.displayName.trim();

    if (displayName.length < 2) {
      return { error: "Display name must be at least 2 characters." };
    }

    if (displayName.length > 48) {
      return { error: "Display name must be 48 characters or fewer." };
    }

    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Not authenticated." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  });
