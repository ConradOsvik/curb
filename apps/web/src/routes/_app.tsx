import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/sidebar/sidebar-provider";
import { getSession } from "@/lib/server/session";
import { getSidebarState } from "@/lib/server/sidebar";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const [session, sidebarOpen] = await Promise.all([
      getSession(),
      getSidebarState(),
    ]);
    if (!session) {
      throw redirect({ search: { redirect: location.href }, to: "/login" });
    }
    return { session: session.session, sidebarOpen, user: session.user };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, sidebarOpen } = Route.useRouteContext();

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar
        user={{
          avatar: user.image ?? "",
          email: user.email,
          name: user.name,
        }}
      />
      <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
