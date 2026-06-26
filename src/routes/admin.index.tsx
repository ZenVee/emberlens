import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { stats, bookings, photos } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Ember Lens" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AdminShell title="Welcome back, Ember" subtitle="Here's what's happening in the studio this week.">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-display text-3xl">{s.value}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-ember">
                <TrendingUp className="h-3 w-3" /> +12%
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent bookings</h2>
            <button className="inline-flex items-center gap-1 text-sm text-ember hover:underline">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="py-2 pr-3">Client</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Date</th><th className="py-2">Status</th></tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="border-t border-border/60">
                    <td className="py-3 pr-3 font-medium">{b.name}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{b.type}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{b.date}</td>
                    <td className="py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg">Latest uploads</h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 9).map((p) => (
              <img key={p.id} src={p.src} alt={p.title} loading="lazy" width={200} height={200} className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border/60 bg-gradient-night p-6 shadow-card">
        <h2 className="font-display text-lg">This week at a glance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Mock chart — connect data once the backend is live.</p>
        <div className="mt-5 flex h-40 items-end gap-2">
          {[40, 65, 50, 75, 90, 60, 80].map((v, i) => (
            <div key={i} className="flex-1 rounded-t-xl bg-gradient-ember" style={{ height: `${v}%`, opacity: 0.7 + (i % 3) * 0.1 }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
        </div>
      </section>
    </AdminShell>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-blush/20 text-blush",
    Confirmed: "bg-ember/20 text-ember",
    Declined: "bg-destructive/20 text-destructive",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] ?? "bg-secondary"}`}>{status}</span>;
}
