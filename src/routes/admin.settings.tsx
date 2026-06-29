import { createFileRoute } from "@tanstack/react-router";

import {
  SettingsBrandTab,
  SettingsFooterTab,
  SettingsHomepageTab,
  SettingsPagesTab,
  SettingsThemeTab,
} from "@/components/admin/settings/settings-tabs";
import { AdminLoading } from "@/components/admin-loading";
import { SaveStatus } from "@/components/save-status";
import { Form } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SETTINGS_TABS,
  useSiteSettingsEditor,
  type SettingsTab,
} from "@/hooks/admin/use-site-settings-editor";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Ember Lens Studio" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const editor = useSiteSettingsEditor();

  if (editor.isPending || !editor.loaded) {
    return <AdminLoading variant="form" />;
  }

  return (
    <Form {...editor.settingsForm}>
      <Tabs
        value={editor.activeTab}
        onValueChange={(v) => editor.setActiveTab(v as SettingsTab)}
        className="space-y-6"
      >
        {(editor.message || editor.error || editor.saveError || editor.isError) && (
          <div className="space-y-2">
            {editor.message && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                {editor.message}
              </p>
            )}
            {(editor.error || editor.saveError || editor.isError) && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {editor.error ??
                  editor.saveError ??
                  (editor.loadError instanceof Error
                    ? editor.loadError.message
                    : "Could not load settings.")}
              </p>
            )}
          </div>
        )}

        <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:-mx-8 md:px-8">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-secondary/60 p-1 sm:w-auto">
            {SETTINGS_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 px-3 py-2 data-[state=active]:shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <SaveStatus status={editor.saveStatus} error={editor.saveError} className="shrink-0" />
        </div>

        <SettingsBrandTab {...editor} />
        <SettingsHomepageTab {...editor} />
        <SettingsPagesTab {...editor} />
        <SettingsThemeTab
          form={editor.form}
          updateField={editor.updateField}
          saveOnBlur={editor.saveOnBlur}
        />
        <SettingsFooterTab
          form={editor.form}
          updateField={editor.updateField}
          saveOnBlur={editor.saveOnBlur}
        />
      </Tabs>
    </Form>
  );
}
