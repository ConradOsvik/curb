import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { type ConvexQueryClient } from "@convex-dev/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";

import appCss from "../index.css?url";

const getAuth = createServerFn({ method: "GET" }).handler(
  async () => await getToken()
);

export interface RouterAppContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async (ctx) => {
    const token = await getAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return {
      isAuthenticated: !!token,
      token,
    };
  },

  component: RootDocument,
  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
    ],
    meta: [
      {
        charSet: "utf8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: "Curb",
      },
    ],
  }),
});

function RootDocument() {
  const context = useRouteContext({ from: Route.id });
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <html lang="en" suppressHydrationWarning>
          <head>
            <script
              // oxlint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `
                  (function() {
                    const storageKey = 'ui-theme';
                    const theme = localStorage.getItem(storageKey);
                    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    const isDark = theme === 'dark' || (theme !== 'light' && systemDark);
                    document.documentElement.classList.toggle('dark', isDark);
                  })();
                `,
              }}
            />
            <HeadContent />
          </head>
          <body>
            <Outlet />
            <Toaster richColors />
            <TanStackDevtools
              plugins={[
                {
                  defaultOpen: true,
                  name: "TanStack Query",
                  render: <ReactQueryDevtoolsPanel />,
                },
                {
                  defaultOpen: false,
                  name: "TanStack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
            <Scripts />
          </body>
        </html>
      </ThemeProvider>
    </ConvexBetterAuthProvider>
  );
}
