import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { ServerMutationError } from "@/lib/mutations/shared";
import { siteSettingsQueryKey } from "@/lib/query-keys";
import { removeHeroImage, updateSiteSettings, uploadHeroImage } from "@/lib/site-settings";
import type { SiteSettings, SiteSettingsForm } from "@/lib/site-settings-types";

export function useUpdateSiteSettingsMutation() {
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updateSiteSettings);

  return useMutation({
    mutationFn: async (data: SiteSettingsForm) => {
      const result = await updateFn({ data });
      if (result.error || !result.settings) {
        throw new ServerMutationError(result.error ?? "Could not save settings.");
      }
      return result.settings;
    },
    onSuccess: (settings) => queryClient.setQueryData(siteSettingsQueryKey, settings),
  });
}

export function useUploadHeroImageMutation() {
  const queryClient = useQueryClient();
  const uploadHeroFn = useServerFn(uploadHeroImage);

  return useMutation({
    mutationFn: async (data: { fileBase64: string; mimeType: string; filename: string }) => {
      const result = await uploadHeroFn({ data });
      if (result.error || !result.settings) {
        throw new ServerMutationError(result.error ?? "Could not upload hero image.");
      }
      return result.settings;
    },
    onSuccess: (settings) => queryClient.setQueryData(siteSettingsQueryKey, settings),
  });
}

export function useRemoveHeroImageMutation() {
  const queryClient = useQueryClient();
  const removeHeroFn = useServerFn(removeHeroImage);

  return useMutation({
    mutationFn: async () => {
      const result = await removeHeroFn();
      if (result.error || !result.settings) {
        throw new ServerMutationError(result.error ?? "Could not remove hero image.");
      }
      return result.settings;
    },
    onSuccess: (settings: SiteSettings) => queryClient.setQueryData(siteSettingsQueryKey, settings),
  });
}
