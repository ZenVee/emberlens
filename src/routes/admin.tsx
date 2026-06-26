import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context, location }) => {
    const isLogin = location.pathname === "/admin/login";

    if (isLogin) {
      if (context.user) {
        throw redirect({ to: "/admin" });
      }
      return;
    }

    if (!context.user) {
      throw redirect({ to: "/admin/login", search: { error: undefined } });
    }
  },
  component: () => <Outlet />,
});
