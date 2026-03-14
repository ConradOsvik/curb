import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { useActiveHoverHighlight } from "@/components/ui/hover-highlight";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  hasChildren?: boolean;
  onClick?: () => void;
  shortcut?: string;
}

export function SidebarItem({
  to,
  icon: Icon,
  label,
  isActive,
  hasChildren,
  onClick,
  shortcut,
}: SidebarItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ctx = useActiveHoverHighlight();

  useEffect(() => {
    if (isActive && ref.current && ctx) {
      ctx.registerActive(ref.current);
    }
  }, [isActive, ctx]);

  const handleMouseEnter = () => {
    if (ref.current && ctx) {
      ctx.onItemHover(ref.current);
    }
  };

  const content = (
    <>
      {Icon && <Icon className="size-4 shrink-0" />}
      <span className="truncate">{label}</span>
      {shortcut && (
        <span className="ml-auto text-xs text-muted-foreground">
          {shortcut}
        </span>
      )}
      {hasChildren && <ChevronRightIcon className="ml-auto size-4 shrink-0" />}
    </>
  );

  const className = cn(
    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors cursor-pointer",
    isActive
      ? "text-accent-foreground"
      : "text-muted-foreground hover:text-accent-foreground"
  );

  if (to) {
    return (
      <div ref={ref} onMouseEnter={handleMouseEnter}>
        <Link to={to} className={className} onClick={onClick}>
          {content}
        </Link>
      </div>
    );
  }

  return (
    <div ref={ref} onMouseEnter={handleMouseEnter}>
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    </div>
  );
}
