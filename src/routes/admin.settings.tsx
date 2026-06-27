import { createFileRoute } from "@tanstack/react-router";
import { useAdminPageMeta } from "@/components/admin-page-meta";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Ember Lens Studio" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  useAdminPageMeta({ title: "Settings", subtitle: "Studio profile, appearance, and notifications." });

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card lg:col-span-2">
          <h2 className="font-display text-lg">Studio profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">This is what shows up on your public site.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Studio name" defaultValue="Ember Lens" />
            <Field label="Tagline" defaultValue="Capturing Los Santos, one frame at a time." />
            <Field label="Location" defaultValue="Vinewood Blvd, Los Santos" />
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">Bio</label>
              <textarea rows={4} defaultValue="A one-person cinematic photography studio operating after dark across Los Santos and Blaine County." className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ember" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="rounded-full bg-gradient-ember px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow">Save changes</button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h2 className="font-display text-lg">Appearance</h2>
            <p className="mt-1 text-sm text-muted-foreground">Toggle between cozy dark and warm light mode.</p>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
              <span className="text-sm">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h2 className="font-display text-lg">Notifications</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Toggle label="New booking requests" defaultOn />
              <Toggle label="Project comments" defaultOn />
              <Toggle label="Weekly summary" />
            </div>
          </div>

          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="font-display text-lg text-destructive">Danger zone</h2>
            <p className="mt-1 text-sm text-muted-foreground">Permanently remove studio data. This cannot be undone.</p>
            <button className="mt-4 rounded-full border border-destructive/50 px-4 py-2 text-sm text-destructive hover:bg-destructive/10">Delete studio</button>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input defaultValue={defaultValue} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ember" />
    </label>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
      <span>{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-muted transition-colors checked:bg-ember relative after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] checked:after:translate-x-4" />
    </label>
  );
}
