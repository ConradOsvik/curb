import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Header } from "@/components/layout/header";
import Loader from "@/components/loader";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: "/login" });
    }
  }, [isPending, session, navigate]);

  if (isPending || !session) {
    return <Loader />;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          avatar: session.user.image ?? "",
          email: session.user.email ?? "",
          name: session.user.name ?? "User",
        }}
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
