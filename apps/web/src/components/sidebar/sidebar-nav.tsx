import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  SwatchIcon,
  TableCellsIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

import { ActiveHoverHighlightRoot } from "@/components/ui/hover-highlight";

import { CommandMenu } from "./command-menu";
import { SidebarItem } from "./sidebar-item";

type Panel = "root" | "settings";

const settingsItems = [
  { exact: true, icon: UserIcon, label: "Profile", to: "/settings" },
  { icon: SwatchIcon, label: "Appearance", to: "/settings/appearance" },
  { icon: LockClosedIcon, label: "Security", to: "/settings/security" },
  {
    icon: ExclamationTriangleIcon,
    label: "Danger Zone",
    to: "/settings/danger-zone",
  },
];

const SLIDE_PX = 16;

const panelVariants = {
  center: { filter: "blur(0px)", opacity: 1, x: 0 },
  enter: (d: number) => ({
    filter: "blur(4px)",
    opacity: 0,
    x: d * SLIDE_PX,
  }),
  exit: (d: number) => ({
    filter: "blur(4px)",
    opacity: 0,
    x: d * -SLIDE_PX,
  }),
};

const panelTransition = { duration: 0.15, ease: "easeOut" as const };

function getPanelFromPath(path: string): Panel {
  return path.startsWith("/settings") ? "settings" : "root";
}

export function SidebarNav() {
  const currentPath = useRouterState({
    select: (s) => s.location.pathname,
  });

  const routePanel = getPanelFromPath(currentPath);
  const [showRootOverride, setShowRootOverride] = React.useState(false);

  // Clear the override when navigating away from settings
  React.useEffect(() => {
    if (routePanel === "root") {
      setShowRootOverride(false);
    }
  }, [routePanel]);

  const activePanel = showRootOverride ? "root" : routePanel;

  // Compute direction synchronously during render so AnimatePresence
  // sees the correct value on the same render cycle as the panel change.
  const prevPanelRef = React.useRef(activePanel);
  const directionRef = React.useRef(0);

  if (prevPanelRef.current !== activePanel) {
    directionRef.current = activePanel === "settings" ? 1 : -1;
    prevPanelRef.current = activePanel;
  }

  const direction = directionRef.current;

  const navigate = useNavigate();
  const [commandMenuOpen, setCommandMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandMenuOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col p-2">
      <button
        type="button"
        onClick={() => setCommandMenuOpen(true)}
        className="flex w-full cursor-text items-center gap-2 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 dark:bg-input/30"
      >
        <MagnifyingGlassIcon className="size-4 shrink-0" />
        <span>Search</span>
        <span className="ml-auto text-xs">⌘K</span>
      </button>
      <div className="relative mt-1 flex-1 overflow-x-clip">
        <AnimatePresence initial={false} custom={direction}>
          {activePanel === "root" ? (
            <motion.div
              key="root"
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              variants={panelVariants}
              transition={panelTransition}
              className="absolute inset-0"
            >
              <ActiveHoverHighlightRoot className="flex flex-col">
                <SidebarItem
                  to="/dashboard"
                  icon={DocumentTextIcon}
                  label="Files"
                  isActive={currentPath === "/dashboard"}
                />
                <SidebarItem
                  to="/sheets"
                  icon={TableCellsIcon}
                  label="Sheets"
                  isActive={currentPath.startsWith("/sheets")}
                />
                <SidebarItem
                  to="/trash"
                  icon={TrashIcon}
                  label="Trash"
                  isActive={currentPath === "/trash"}
                />
                <SidebarItem
                  icon={Cog6ToothIcon}
                  label="Settings"
                  hasChildren
                  isActive={currentPath.startsWith("/settings")}
                  onClick={() => {
                    setShowRootOverride(false);
                    if (!currentPath.startsWith("/settings")) {
                      void navigate({ to: "/settings" });
                    }
                  }}
                />
              </ActiveHoverHighlightRoot>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              variants={panelVariants}
              transition={panelTransition}
              className="absolute inset-0"
            >
              <ActiveHoverHighlightRoot className="flex flex-col">
                <SidebarItem
                  icon={ArrowLeftIcon}
                  label="Settings"
                  onClick={() => setShowRootOverride(true)}
                />
                {settingsItems.map((item) => (
                  <SidebarItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={
                      item.exact
                        ? currentPath === item.to
                        : currentPath.startsWith(item.to)
                    }
                  />
                ))}
              </ActiveHoverHighlightRoot>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <CommandMenu open={commandMenuOpen} onOpenChange={setCommandMenuOpen} />
    </div>
  );
}
