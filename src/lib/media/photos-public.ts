import { createServerFn } from "@tanstack/react-start";

import { toPublicPhoto, type DbPhoto, type PublicPhoto } from "../media-types";
import { shuffleArray } from "../gallery-orientation";
import { getSupabaseServerClient } from "../supabase";
import { PHOTO_SELECT } from "./shared";

export const fetchPublishedPhotos = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPhoto[]> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("photos")
      .select(PHOTO_SELECT)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return shuffleArray((data as DbPhoto[]).map(toPublicPhoto));
  },
);

export const fetchFeaturedPhotos = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPhoto[]> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("photos")
      .select(PHOTO_SELECT)
      .eq("published", true)
      .eq("featured", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) throw error;
    return (data as DbPhoto[]).map(toPublicPhoto);
  },
);
