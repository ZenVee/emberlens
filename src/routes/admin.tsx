import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context, location }) => {
    const isLogin = location.pathname === "/admin/login";
    const isOnboarding = location.pathname === "/admin/onboarding";

    if (isLogin) {
      if (context.user?.isAdmin) {
        throw redirect({
          to: context.user.needsOnboarding ? "/admin/onboarding" : "/admin",
        });
      }
      return;
    }

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
  component: () => <Outlet />,
});
