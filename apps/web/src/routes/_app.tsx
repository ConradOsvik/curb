import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) {
      throw redirect({ search: { redirect: location.href }, to: "/login" });
    }
    return { user: session.user };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user } = Route.useRouteContext();

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          avatar: user.image ?? "",
          email: user.email,
          name: user.name,
        }}
      />
      <SidebarInset>
        <Header />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
