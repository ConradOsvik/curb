import { ArrowPathIcon, TrashIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface TrashContextMenuProps {
  children: ReactNode;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

export function TrashContextMenu({
  children,
  onRestore,
  onPermanentDelete,
}: TrashContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block h-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onRestore} className="gap-2">
          <ArrowPathIcon className="size-4" />
          Restore
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={onPermanentDelete}
          variant="destructive"
          className="gap-2"
        >
          <TrashIcon className="size-4" />
          Delete permanently
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
