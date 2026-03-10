import type { Folder } from "@curb/db/types";
import {
  EyeIcon,
  FolderArrowDownIcon,
  FolderIcon,
  HomeIcon,
  PencilIcon,
  SwatchIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const folderColors = [
  { class: "bg-red-500", label: "Red", value: "red" },
  { class: "bg-orange-500", label: "Orange", value: "orange" },
  { class: "bg-yellow-500", label: "Yellow", value: "yellow" },
  { class: "bg-green-500", label: "Green", value: "green" },
  { class: "bg-blue-500", label: "Blue", value: "blue" },
  { class: "bg-purple-500", label: "Purple", value: "purple" },
  { class: "bg-pink-500", label: "Pink", value: "pink" },
  { class: "bg-gray-500", label: "Gray", value: "gray" },
] as const;

interface FolderContextMenuProps {
  type: "folder";
  children: ReactNode;
  folders: Folder[];
  currentFolderId?: string;
  onRename: () => void;
  onChangeColor: (color: string) => void;
  onMove: (folderId?: string) => void;
  onDelete: () => void;
}

interface ReceiptContextMenuProps {
  type: "receipt";
  children: ReactNode;
  folders: Folder[];
  currentFolderId?: string;
  onViewDetails: () => void;
  onMove: (folderId?: string) => void;
  onDelete: () => void;
}

type ItemContextMenuProps = FolderContextMenuProps | ReceiptContextMenuProps;

export function ItemContextMenu(props: ItemContextMenuProps) {
  const { type, children, folders, currentFolderId, onMove, onDelete } = props;

  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block h-full">{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {type === "receipt" && (
          <>
            <ContextMenuItem onClick={props.onViewDetails} className="gap-2">
              <EyeIcon className="size-4" />
              View Details
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {type === "folder" && (
          <>
            <ContextMenuItem onClick={props.onRename} className="gap-2">
              <PencilIcon className="size-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2">
                <SwatchIcon className="size-4" />
                Change Color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {folderColors.map((color) => (
                  <ContextMenuItem
                    key={color.value}
                    onClick={() => props.onChangeColor(color.value)}
                    className="gap-2"
                  >
                    <div className={`size-3 rounded-full ${color.class}`} />
                    {color.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <FolderArrowDownIcon className="size-4" />
            Move to
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {currentFolderId && (
              <ContextMenuItem onClick={() => onMove()} className="gap-2">
                <HomeIcon className="size-4" />
                Home (Root)
              </ContextMenuItem>
            )}
            {availableFolders.length > 0 && currentFolderId && (
              <ContextMenuSeparator />
            )}
            {availableFolders.map((folder) => (
              <ContextMenuItem
                key={folder.id}
                onClick={() => onMove(folder.id)}
                className="gap-2"
              >
                <FolderIcon className="size-4" />
                {folder.name}
              </ContextMenuItem>
            ))}
            {availableFolders.length === 0 && !currentFolderId && (
              <ContextMenuItem disabled className="text-muted-foreground">
                No folders available
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={onDelete}
          variant="destructive"
          className="gap-2"
        >
          <TrashIcon className="size-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
