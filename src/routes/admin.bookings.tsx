import { createFileRoute } from "@tanstack/react-router";
import { Check, X, Mail } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { bookings } from "@/lib/mock-data";
import { StatusBadge } from "./admin.index";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Ember Lens Studio" }] }),
  component: AdminBookings,
});

function AdminBookings() {
  return (
    <AdminShell title="Bookings" subtitle={`${bookings.filter(b => b.status === "Pending").length} pending requests`}>
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", "Pending", "Confirmed", "Declined"].map((t, i) => (
          <button key={t} className={`rounded-full border px-4 py-1.5 text-sm ${i === 0 ? "border-ember bg-gradient-ember text-primary-foreground shadow-glow" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-all hover:border-ember/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-ember text-sm font-semibold text-primary-foreground">
                  {b.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-sm text-muted-foreground">{b.type} · {b.location}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Requested for {b.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={b.status} />
                <button className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary" title="Message"><Mail className="h-4 w-4" /></button>
                <button className="grid h-9 w-9 place-items-center rounded-full bg-ember/20 text-ember hover:bg-ember/30" title="Accept"><Check className="h-4 w-4" /></button>
                <button className="grid h-9 w-9 place-items-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20" title="Decline"><X className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
