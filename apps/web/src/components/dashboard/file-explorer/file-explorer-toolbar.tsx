import { useDroppable } from "@dnd-kit/core";
import {
  ArrowUpTrayIcon,
  ChevronRightIcon,
  FolderPlusIcon,
  HomeIcon,
} from "@heroicons/react/24/solid";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ViewToggle } from "./view-toggle";

interface FileExplorerToolbarProps {
  path: { id: string; name: string }[];
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onNavigate: (folderId?: string) => void;
}

function DroppableBreadcrumb({
  id,
  isCurrentPage,
  children,
  onClick,
}: {
  id: string;
  isCurrentPage: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `breadcrumb:${id}`,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={isCurrentPage}
      onClick={onClick}
      className={cn(
        "rounded-md px-1.5 py-0.5 text-sm font-medium transition-colors",
        isCurrentPage
          ? "cursor-default text-foreground"
          : "cursor-pointer text-muted-foreground hover:text-foreground",
        isOver && "bg-blue-500/20 ring-2 ring-blue-500"
      )}
    >
      {children}
    </button>
  );
}

export function FileExplorerToolbar({
  path,
  view,
  onViewChange,
  onNewFolder,
  onUpload,
  onNavigate,
}: FileExplorerToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b px-4 py-2">
      <nav
        aria-label="breadcrumb"
        className="flex min-w-0 flex-1 items-center gap-0.5"
      >
        <DroppableBreadcrumb
          id="__root__"
          isCurrentPage={path.length === 0}
          onClick={() => onNavigate()}
        >
          <HomeIcon className="size-4" />
        </DroppableBreadcrumb>

        {path.map((folder, i) => {
          const isLast = i === path.length - 1;
          return (
            <Fragment key={folder.id}>
              <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/50" />
              <DroppableBreadcrumb
                id={folder.id}
                isCurrentPage={isLast}
                onClick={() => onNavigate(folder.id)}
              >
                <span className="truncate">{folder.name}</span>
              </DroppableBreadcrumb>
            </Fragment>
          );
        })}
      </nav>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewFolder}
          className="text-muted-foreground"
        >
          <FolderPlusIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUpload}
          className="text-muted-foreground"
        >
          <ArrowUpTrayIcon className="size-4" />
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>
    </div>
  );
}
