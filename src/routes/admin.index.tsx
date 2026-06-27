import { createFileRoute } from "@tanstack/react-router";

import { useAdminPageMeta } from "@/components/admin-page-meta";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Ember Lens" }] }),
  component: Dashboard,
});

function Dashboard() {
  useAdminPageMeta({ title: "Dashboard" });
  return null;
}
