import { convexQuery } from "@convex-dev/react-query";
import { api } from "@curb/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: user } = useQuery(convexQuery(api.auth.getCurrentUser, {}));

  return (
    <SidebarProvider>
      <AppSidebar
        user={
          user
            ? {
                avatar: user.image ?? "",
                email: user.email ?? "",
                name: user.name ?? "User",
              }
            : undefined
        }
      />
      <SidebarInset>
        <Header />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
