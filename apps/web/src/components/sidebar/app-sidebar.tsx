import { Link, useRouterState } from "@tanstack/react-router";
import { Receipt, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { NavUser } from "./nav-user";

const navItems = [
  {
    icon: Receipt,
    label: "Receipts",
    to: "/dashboard",
  },
  {
    icon: Settings,
    label: "Settings",
    to: "/settings",
  },
] as const;

interface AppSidebarProps {
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/dashboard" search={{}} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-foreground text-background">
                <span className="text-sm font-bold">C</span>
              </div>
              <span className="truncate text-lg font-semibold tracking-tight">
                Curb
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    render={
                      item.to === "/dashboard" ? (
                        <Link to="/dashboard" search={{}} />
                      ) : (
                        <Link to={item.to} />
                      )
                    }
                    isActive={currentPath === item.to}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
