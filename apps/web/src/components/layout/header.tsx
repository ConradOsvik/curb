import { useRouterState } from "@tanstack/react-router";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const routeLabels: Record<string, string> = {
  "/dashboard": "Receipts",
  "/settings": "Settings",
  "/trash": "Trash",
};

export function Header() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const label = routeLabels[currentPath] ?? "";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </header>
  );
}
