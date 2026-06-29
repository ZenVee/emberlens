import { Building2, FileText, Home, Palette, PanelBottom } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { useAdminPageMeta } from "@/components/use-admin-page-meta";
import { useAdminSiteSettings } from "@/lib/admin-queries";
import { fileToBase64 } from "@/lib/site-settings-form";
import {
  useRemoveHeroImageMutation,
  useUpdateSiteSettingsMutation,
  useUploadHeroImageMutation,
} from "@/lib/mutations/site-settings";
import { mutationErrorMessage } from "@/lib/mutations/shared";
import {
  siteSettingsFormSchema,
  type SiteSettingsFormValues,
} from "@/lib/schemas/site-settings-form";
import {
  DEFAULT_SITE_SETTINGS,
  toSiteSettingsForm,
  type SiteSettings,
  type SiteService,
} from "@/lib/site-settings-types";
import type { AutoSaveStatus } from "@/hooks/use-auto-save";
import { applySiteTheme, pickSiteTheme } from "@/lib/site-theme";

export const SETTINGS_TABS = [
  { value: "brand", label: "Brand", icon: Building2 },
  { value: "homepage", label: "Homepage", icon: Home },
  { value: "pages", label: "Pages", icon: FileText },
  { value: "theme", label: "Theme", icon: Palette },
  { value: "footer", label: "Footer", icon: PanelBottom },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"];

export function useSiteSettingsEditor() {
  const { data, isPending, isError, error: loadError } = useAdminSiteSettings();
  const { mutateAsync: updateSettings } = useUpdateSiteSettingsMutation();
  const uploadHeroMutation = useUploadHeroImageMutation();
  const removeHeroMutation = useRemoveHeroImageMutation();
  const heroRef = useRef<HTMLInputElement>(null);
  const hasInitializedRef = useRef(false);
  const lastSavedRef = useRef("");

  const settingsForm = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsFormSchema),
    defaultValues: toSiteSettingsForm(DEFAULT_SITE_SETTINGS),
    mode: "onChange",
  });

  const watched = settingsForm.watch();
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("brand");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useAdminPageMeta({
    title: "Settings",
    subtitle: "Brand, homepage copy, theme, and public page content.",
  });

  useEffect(() => {
    applySiteTheme(pickSiteTheme(watched));
  }, [watched]);

  const persistSettings = useCallback(
    async (next: SiteSettingsFormValues) => {
      try {
        await updateSettings(next);
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          error: mutationErrorMessage(err, "Could not save settings."),
        };
      }
    },
    [updateSettings],
  );

  const syncBaseline = useCallback((next: SiteSettingsFormValues) => {
    lastSavedRef.current = JSON.stringify(next);
    setSaveStatus("idle");
    setSaveError(null);
  }, []);

  const saveNow = useCallback(async () => {
    const current = settingsForm.getValues();
    const snapshot = JSON.stringify(current);
    if (snapshot === lastSavedRef.current) return;

    setSaveStatus("saving");
    setSaveError(null);
    const result = await persistSettings(current);
    if (result.ok) {
      lastSavedRef.current = snapshot;
      setSaveStatus("saved");
    } else {
      setSaveError(result.error ?? "Could not save.");
      setSaveStatus("error");
    }
  }, [persistSettings, settingsForm]);

  const saveOnBlur = useCallback(() => {
    void saveNow();
  }, [saveNow]);

  useEffect(() => {
    if (!data || hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    const nextForm = toSiteSettingsForm(data);
    settingsForm.reset(nextForm);
    syncBaseline(nextForm);
    setHeroUrl(data.hero_image_url);
  }, [data, settingsForm, syncBaseline]);

  function syncSettings(settings: SiteSettings) {
    const nextForm = toSiteSettingsForm(settings);
    settingsForm.reset(nextForm);
    setHeroUrl(settings.hero_image_url);
    syncBaseline(nextForm);
  }

  function updateField<K extends keyof SiteSettingsFormValues>(
    key: K,
    value: SiteSettingsFormValues[K],
    options?: { save?: boolean },
  ) {
    settingsForm.setValue(key, value, { shouldDirty: true, shouldValidate: true });
    if (options?.save) void saveNow();
  }

  function updateService(index: number, patch: Partial<SiteService>) {
    const services = settingsForm.getValues("services");
    settingsForm.setValue(
      "services",
      services.map((service, i) => (i === index ? { ...service, ...patch } : service)),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function updateCategoryList(
    key: "photo_categories" | "project_categories" | "session_types",
    index: number,
    value: string,
  ) {
    const items = settingsForm.getValues(key);
    settingsForm.setValue(
      key,
      items.map((item, i) => (i === index ? value : item)),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  async function handleHeroUpload(file: File) {
    setError(null);
    setMessage(null);

    try {
      const base64 = await fileToBase64(file);
      const settings = await uploadHeroMutation.mutateAsync({
        fileBase64: base64,
        mimeType: file.type || "image/jpeg",
        filename: file.name,
      });
      syncSettings(settings);
      setMessage("Hero image updated.");
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not upload hero image."));
    } finally {
      if (heroRef.current) heroRef.current.value = "";
    }
  }

  async function handleRemoveHero() {
    setError(null);
    try {
      const settings = await removeHeroMutation.mutateAsync();
      syncSettings(settings);
      setMessage("Hero image removed.");
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not remove hero image."));
    }
  }

  return {
    settingsForm,
    form: watched,
    isPending,
    isError,
    loadError,
    loaded: data !== undefined,
    heroUrl,
    heroRef,
    activeTab,
    setActiveTab,
    uploadingHero: uploadHeroMutation.isPending || removeHeroMutation.isPending,
    message,
    error,
    saveStatus,
    saveError,
    saveOnBlur,
    updateField,
    updateService,
    updateCategoryList,
    handleHeroUpload,
    handleRemoveHero,
  };
}

export type SiteSettingsEditorState = ReturnType<typeof useSiteSettingsEditor>;
export type SiteSettingsFieldsForm = UseFormReturn<SiteSettingsFormValues>;
