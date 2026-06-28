import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { fetchUser, type AuthUser } from "../lib/auth";
import { authUserQueryKey, siteSettingsQueryKey } from "../lib/query-keys";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "../lib/site-settings-types";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "../components/theme-provider";
import { SiteThemeProvider } from "../components/site-theme-provider";

async function fetchUserQuery() {
  const { fetchUser: fetchUserFn } = await import("../lib/auth");
  return fetchUserFn();
}

async function fetchSiteSettingsQuery() {
  const { fetchSiteSettings } = await import("../lib/site-settings");
  return fetchSiteSettings();
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-ember">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Frame not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page wandered off into the night. Let's get you back home.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-ember px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex rounded-full bg-gradient-ember px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  user: AuthUser | null;
  settings: SiteSettings;
}>()({
  beforeLoad: async ({ context }) => {
    const cachedUser = context.queryClient.getQueryData<AuthUser | null>(authUserQueryKey);
    const userPromise =
      cachedUser !== undefined
        ? (void context.queryClient.prefetchQuery({
            queryKey: authUserQueryKey,
            queryFn: fetchUserQuery,
          }),
          Promise.resolve(cachedUser))
        : context.queryClient.ensureQueryData({
            queryKey: authUserQueryKey,
            queryFn: fetchUserQuery,
          });

    const settingsPromise = context.queryClient.ensureQueryData({
      queryKey: siteSettingsQueryKey,
      queryFn: fetchSiteSettingsQuery,
    });

    const [user, settings] = await Promise.all([userPromise, settingsPromise]);
    return { user, settings };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ember Lens — Los Santos Photography" },
      { name: "description", content: "Ember Lens is a cinematic photography studio capturing Los Santos — one frame at a time." },
      { property: "og:title", content: "Ember Lens — Los Santos Photography" },
      { property: "og:description", content: "Cinematic portrait, event, automotive, and lifestyle photography in Los Santos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SiteThemeProvider />
        <Outlet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
