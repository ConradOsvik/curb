import { useRouterState } from "@tanstack/react-router";

import { useSidebar } from "@/components/sidebar/sidebar-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function PanelLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-slot="icon"
      className={className}
    >
      <path d="M3.75 3.75h16.5a2.25 2.25 0 0 1 2.25 2.25v12a2.25 2.25 0 0 1-2.25 2.25H3.75a2.25 2.25 0 0 1-2.25-2.25V6a2.25 2.25 0 0 1 2.25-2.25Z" />
      <path d="M9 3.75v16.5" />
    </svg>
  );
}

function getRouteLabel(path: string): string {
  if (path === "/settings") {
    return "Profile";
  }
  if (path.startsWith("/settings/appearance")) {
    return "Appearance";
  }
  if (path.startsWith("/settings/security")) {
    return "Security";
  }
  if (path.startsWith("/settings/danger-zone")) {
    return "Danger Zone";
  }
  if (path.startsWith("/settings")) {
    return "Settings";
  }
  if (path === "/dashboard") {
    return "Receipts";
  }
  if (path === "/trash") {
    return "Trash";
  }
  return "";
}

export function Header() {
  const { toggleSidebar } = useSidebar();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const label = getRouteLabel(currentPath);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        className="-ml-1"
        onClick={toggleSidebar}
      >
        <PanelLeftIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </header>
  );
}
