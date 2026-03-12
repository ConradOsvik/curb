import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/solid";
import { type ComponentType, Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ViewToggle } from "./view-toggle";

export interface BreadcrumbItemProps {
  id: string;
  isCurrentPage: boolean;
  children: ReactNode;
  onClick: () => void;
}

function DefaultBreadcrumb({
  isCurrentPage,
  children,
  onClick,
}: BreadcrumbItemProps) {
  return (
    <button
      type="button"
      disabled={isCurrentPage}
      onClick={onClick}
      className={cn(
        "rounded-md px-1.5 py-0.5 text-sm font-medium transition-colors",
        isCurrentPage
          ? "cursor-default text-foreground"
          : "cursor-pointer text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

interface FileExplorerToolbarProps {
  path: { id: string; name: string }[];
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onNavigate: (folderId?: string) => void;
  rootIcon?: ReactNode;
  rootLabel?: string;
  actions?: ReactNode;
  BreadcrumbComponent?: ComponentType<BreadcrumbItemProps>;
}

export function FileExplorerToolbar({
  path,
  view,
  onViewChange,
  onNavigate,
  rootIcon = <HomeIcon className="size-4" />,
  rootLabel = "Home",
  actions,
  BreadcrumbComponent = DefaultBreadcrumb,
}: FileExplorerToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b px-4 py-2">
      <nav
        aria-label="breadcrumb"
        className="flex min-w-0 flex-1 items-center gap-0.5"
      >
        <BreadcrumbComponent
          id="__root__"
          isCurrentPage={path.length === 0}
          onClick={() => onNavigate()}
        >
          <span className="flex items-center gap-1">
            {rootIcon}
            <span>{rootLabel}</span>
          </span>
        </BreadcrumbComponent>

        {path.map((folder, i) => {
          const isLast = i === path.length - 1;
          return (
            <Fragment key={folder.id}>
              <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/50" />
              <BreadcrumbComponent
                id={folder.id}
                isCurrentPage={isLast}
                onClick={() => onNavigate(folder.id)}
              >
                <span className="truncate">{folder.name}</span>
              </BreadcrumbComponent>
            </Fragment>
          );
        })}
      </nav>

      <div className="flex items-center gap-1">
        {actions}
        {actions && <div className="mx-1 h-4 w-px bg-border" />}
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>
    </div>
  );
}
