import { FolderPlus, Upload } from "lucide-react";
import type { ReactNode } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface BackgroundContextMenuProps {
  children: ReactNode;
  onNewFolder: () => void;
  onUploadReceipt: () => void;
}

export function BackgroundContextMenu({
  children,
  onNewFolder,
  onUploadReceipt,
}: BackgroundContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="h-full w-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onNewFolder} className="gap-2">
          <FolderPlus className="size-4" />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem onClick={onUploadReceipt} className="gap-2">
          <Upload className="size-4" />
          Upload Receipt
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
