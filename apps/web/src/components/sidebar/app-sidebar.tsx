import { Link } from "@tanstack/react-router";

import { NavUser } from "./nav-user";
import { Sidebar, SidebarFooter, SidebarHeader } from "./sidebar";
import { SidebarNav } from "./sidebar-nav";

interface AppSidebarProps {
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          to="/dashboard"
          search={{}}
          className="flex items-center gap-2 rounded-md px-2 py-1.5"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-foreground text-background">
            <span className="text-sm font-bold">C</span>
          </div>
          <span className="truncate text-lg font-semibold tracking-tight">
            Curb
          </span>
        </Link>
      </SidebarHeader>
      <SidebarNav />
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
