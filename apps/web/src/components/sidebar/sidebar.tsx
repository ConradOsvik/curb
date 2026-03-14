import { motion } from "motion/react";
import * as React from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useSidebar } from "./sidebar-provider";

const SIDEBAR_WIDTH = 256;

const sidebarTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  type: "tween" as const,
};

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { open, isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className="w-72 p-0 [&>button]:hidden"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Navigation sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <motion.aside
      className="hidden h-svh shrink-0 overflow-hidden border-r md:block"
      style={{ width: open ? SIDEBAR_WIDTH : 0 }}
      animate={{ width: open ? SIDEBAR_WIDTH : 0 }}
      transition={sidebarTransition}
    >
      <div className="flex h-full flex-col" style={{ width: SIDEBAR_WIDTH }}>
        {children}
      </div>
    </motion.aside>
  );
}

export function SidebarHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "flex flex-col gap-2 p-2"}>{children}</div>
  );
}

export function SidebarFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "flex flex-col gap-2 p-2"}>{children}</div>
  );
}
