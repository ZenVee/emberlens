import { createFileRoute } from "@tanstack/react-router";
import { useAdminPageMeta } from "@/components/admin-page-meta";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Ember Lens Studio" }] }),
  component: AdminBookings,
});

function AdminBookings() {
  useAdminPageMeta({
    title: "Bookings",
    subtitle: "No booking requests yet",
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", "Pending", "Confirmed", "Declined"].map((t, i) => (
          <button key={t} className={`rounded-full border px-4 py-1.5 text-sm ${i === 0 ? "border-ember bg-gradient-ember text-primary-foreground shadow-glow" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <p className="rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center text-muted-foreground">
        No booking requests yet.
      </p>
    </>
  );
}
