import {
  createFileRoute,
  Outlet,
  redirect,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { AdminPageMetaProvider } from "@/components/admin-page-meta";
import { useAdminPageMetaState } from "@/components/use-admin-page-meta";
import { AdminShell } from "@/components/admin-shell";
import { prefetchAdminDashboard } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context, location, preload }) => {
    const isLogin = location.pathname === "/admin/login";
    const isOnboarding = location.pathname === "/admin/onboarding";

    if (isLogin) {
      if (!preload && context.user?.isAdmin) {
        throw redirect({
          to: context.user.needsOnboarding ? "/admin/onboarding" : "/admin",
        });
      }
      return;
    }

    if (preload) return;

    if (!context.user) {
      throw redirect({ to: "/admin/login", search: { error: undefined } });
    }

    if (!context.user.isAdmin) {
      throw redirect({
        to: "/admin/login",
        search: { error: "You do not have studio admin access." },
      });
    }

    if (context.user.needsOnboarding && !isOnboarding) {
      throw redirect({ to: "/admin/onboarding" });
    }

    if (!context.user.needsOnboarding && isOnboarding) {
      throw redirect({ to: "/admin" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isBare = pathname === "/admin/login" || pathname === "/admin/onboarding";

  return (
    <AdminPageMetaProvider>
      {isBare ? <Outlet /> : <AdminLayoutShell />}
    </AdminPageMetaProvider>
  );
}

function AdminLayoutShell() {
  const meta = useAdminPageMetaState();
  const { queryClient } = useRouteContext({ from: "__root__" });

  useEffect(() => {
    prefetchAdminDashboard(queryClient);
  }, [queryClient]);

  return (
    <AdminShell title={meta.title} subtitle={meta.subtitle}>
      <Outlet />
    </AdminShell>
  );
}
