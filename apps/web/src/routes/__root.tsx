import type { AppRouter } from "@curb/api";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { TRPCClient } from "@trpc/client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TRPCProvider } from "@/lib/trpc";

import appCss from "../index.css?url";

export interface RouterAppContext {
  queryClient: QueryClient;
  trpcClient: TRPCClient<AppRouter>;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
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
  const { queryClient, trpcClient } = useRouteContext({ from: Route.id });
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
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
      </TRPCProvider>
    </QueryClientProvider>
  );
}
