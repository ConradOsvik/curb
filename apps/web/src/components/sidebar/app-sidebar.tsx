import {
  Cog6ToothIcon,
  DocumentTextIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { NavUser } from "./nav-user";

const settingsSubItems = [
  { label: "Profile", to: "/settings" },
  { label: "Appearance", to: "/settings/appearance" },
  { label: "Security", to: "/settings/security" },
  { label: "Danger Zone", to: "/settings/danger-zone" },
];

interface AppSidebarProps {
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const currentPath = useRouterState({
    select: (s) => s.location.pathname,
  });
  const isOnSettings = currentPath.startsWith("/settings");

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
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/dashboard" />}
                  isActive={currentPath === "/dashboard"}
                  tooltip="Files"
                >
                  <DocumentTextIcon className="size-4" />
                  <span>Files</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/trash" />}
                  isActive={currentPath === "/trash"}
                  tooltip="Trash"
                >
                  <TrashIcon className="size-4" />
                  <span>Trash</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/settings" />}
                  isActive={isOnSettings}
                  tooltip="Settings"
                >
                  <Cog6ToothIcon className="size-4" />
                  <span>Settings</span>
                  <ChevronRight
                    className={cn(
                      "ml-auto size-4 transition-transform duration-200",
                      isOnSettings && "rotate-90"
                    )}
                  />
                </SidebarMenuButton>
                {isOnSettings && (
                  <SidebarMenuSub>
                    {settingsSubItems.map((item) => (
                      <SidebarMenuSubItem key={item.to}>
                        <SidebarMenuSubButton
                          render={<Link to={item.to} />}
                          isActive={
                            item.to === "/settings"
                              ? currentPath === "/settings"
                              : currentPath.startsWith(item.to)
                          }
                        >
                          <span>{item.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
