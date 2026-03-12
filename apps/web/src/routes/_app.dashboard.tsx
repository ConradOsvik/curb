import type { ReceiptWithItems } from "@curb/api";
import { useDroppable } from "@dnd-kit/core";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/solid";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AnimatePresence } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { BackgroundContextMenu } from "@/components/dashboard/context-menus/background-context-menu";
import { ItemContextMenu } from "@/components/dashboard/context-menus/item-context-menu";
import { CreateFolderDialog } from "@/components/dashboard/dialogs/create-folder-dialog";
import { ReceiptDetailPanel } from "@/components/dashboard/dialogs/receipt-detail-modal";
import { DraggableItem } from "@/components/dashboard/dnd/draggable-item";
import { DroppableFolder } from "@/components/dashboard/dnd/droppable-folder";
import { PARENT_DROP_ID } from "@/components/dashboard/dnd/file-explorer-dnd-context";
import {
  type BreadcrumbItemProps,
  FileExplorer,
  type ItemWrapperProps,
} from "@/components/dashboard/file-explorer/file-explorer";
import { UploadDropzone } from "@/components/dashboard/file-explorer/upload-dropzone";
import { Button } from "@/components/ui/button";
import {
  useDashboardMutations,
  useDashboardQueries,
  useDashboardState,
  useFileUpload,
  useFolderActions,
  useReceiptActions,
} from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  folder: z.string().optional(),
});

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
  validateSearch: zodValidator(searchSchema),
});

// --- DnD wrappers (dashboard-specific) ---

function DroppableBreadcrumb({
  id,
  isCurrentPage,
  children,
  onClick,
}: BreadcrumbItemProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `breadcrumb:${id}` });

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

function ParentDropCardInline({ onNavigate }: { onNavigate: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: PARENT_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      role="option"
      tabIndex={0}
      aria-selected={false}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1 rounded-lg p-2 outline-none transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-blue-500",
        isOver && "bg-blue-500/20 ring-2 ring-blue-500 rounded-lg"
      )}
      onDoubleClick={onNavigate}
    >
      <FolderIcon className="size-16 shrink-0 text-muted-foreground/60 drop-shadow-sm" />
      <span className="max-w-full truncate rounded-md px-1.5 py-0.5 text-xs font-medium">
        ..
      </span>
    </div>
  );
}

function ParentDropRowInline({ onNavigate }: { onNavigate: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: PARENT_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      role="row"
      tabIndex={0}
      className={cn(
        "group flex h-10 cursor-default items-center gap-3 border-b px-4 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
        isOver && "bg-blue-500/20 ring-2 ring-blue-500"
      )}
      onDoubleClick={onNavigate}
    >
      <FolderIcon className="size-4 shrink-0 text-muted-foreground/60" />
      <span className="flex-1 truncate font-medium">..</span>
      <span className="w-20 shrink-0">&mdash;</span>
      <span className="w-28 shrink-0">&mdash;</span>
      <span className="w-24 shrink-0 text-right">&mdash;</span>
    </div>
  );
}

// --- Main ---

function DashboardPage() {
  const state = useDashboardState();
  const queries = useDashboardQueries(state.currentFolderId);
  const mutations = useDashboardMutations();
  const folderActions = useFolderActions(mutations, state);
  const receiptActions = useReceiptActions(mutations, state.currentFolderId);
  const { handleUpload, scanningCount, uploadFiles } = useFileUpload(
    mutations,
    state.currentFolderId
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const parentFolderId = useMemo(
    () => (queries.path.length >= 2 ? queries.path.at(-2)?.id : undefined),
    [queries.path]
  );

  const handleNavigate = useCallback(
    (folderId?: string) => {
      state.setCurrentFolderId(folderId);
      setEditingId(null);
    },
    [state]
  );

  const handleStartEditing = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  const handleSaveEdit = useCallback(
    (id: string, name: string) => {
      void folderActions.handleRenameFolder(id, name);
      setEditingId(null);
    },
    [folderActions]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleViewReceipt = useCallback(
    (receipt: ReceiptWithItems) => {
      state.setViewingReceipt(receipt);
    },
    [state]
  );

  const handleDeleteItems = useCallback(
    (ids: Set<string>) => {
      for (const id of ids) {
        const item = queries.items.find((entry) => entry.item.id === id);
        if (item?.type === "folder") {
          void folderActions.handleDeleteFolder(id);
        } else {
          void receiptActions.handleDeleteReceipt(id);
        }
      }
    },
    [queries.items, folderActions, receiptActions]
  );

  const handleEscape = useCallback(() => {
    if (state.viewingReceipt) {
      state.setViewingReceipt(null);
      return true;
    }
    return false;
  }, [state]);

  const renderItemWrapper = useCallback(
    ({ entry, selected, isEditing, children }: ItemWrapperProps) => {
      if (entry.type === "folder") {
        const folder = entry.item;
        return (
          <ItemContextMenu
            type="folder"
            folders={queries.allFolders.filter((f) => f.id !== folder.id)}
            currentFolderId={state.currentFolderId}
            onRename={() => handleStartEditing(folder.id)}
            onChangeColor={(color) =>
              void folderActions.handleChangeFolderColor(folder.id, color)
            }
            onMove={(targetId) =>
              void folderActions.handleMoveFolder(folder.id, targetId)
            }
            onDelete={() => void folderActions.handleDeleteFolder(folder.id)}
          >
            <DraggableItem
              id={folder.id}
              data={{ item: folder, type: "folder" }}
              isSelected={selected}
              disabled={isEditing}
            >
              <DroppableFolder id={folder.id}>{() => children}</DroppableFolder>
            </DraggableItem>
          </ItemContextMenu>
        );
      }

      const receipt = entry.item;
      return (
        <ItemContextMenu
          type="receipt"
          folders={queries.allFolders}
          currentFolderId={state.currentFolderId}
          onViewDetails={() => handleViewReceipt(receipt)}
          onMove={(targetId) =>
            void receiptActions.handleMoveReceipt(receipt.id, targetId)
          }
          onDelete={() => void receiptActions.handleDeleteReceipt(receipt.id)}
        >
          <DraggableItem
            id={receipt.id}
            data={{ item: receipt, type: "receipt" }}
            isSelected={selected}
          >
            {children}
          </DraggableItem>
        </ItemContextMenu>
      );
    },
    [
      queries.allFolders,
      state,
      folderActions,
      receiptActions,
      handleStartEditing,
      handleViewReceipt,
    ]
  );

  const contentWrapper = useCallback(
    (children: React.ReactNode) => (
      <UploadDropzone
        onFiles={(files) => void uploadFiles(files)}
        className="h-full"
      >
        <BackgroundContextMenu
          onNewFolder={() => setCreateFolderOpen(true)}
          onUploadReceipt={() => fileInputRef.current?.click()}
        >
          {children}
        </BackgroundContextMenu>
      </UploadDropzone>
    ),
    [uploadFiles]
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <FileExplorer
        items={queries.items}
        path={queries.path}
        currentFolderId={state.currentFolderId}
        parentFolderId={parentFolderId}
        onNavigate={handleNavigate}
        onViewReceipt={handleViewReceipt}
        renderItemWrapper={renderItemWrapper}
        renderParentCard={(onNav) => (
          <ParentDropCardInline onNavigate={onNav} />
        )}
        renderParentRow={(onNav) => <ParentDropRowInline onNavigate={onNav} />}
        contentWrapper={contentWrapper}
        rootIcon={<DocumentTextIcon className="size-4" />}
        rootLabel="Files"
        toolbarActions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateFolderOpen(true)}
              className="text-muted-foreground"
            >
              <FolderPlusIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground"
            >
              <ArrowUpTrayIcon className="size-4" />
            </Button>
          </>
        }
        BreadcrumbComponent={DroppableBreadcrumb}
        dndConfig={{
          handleMoveFolder: (id, targetId) =>
            void folderActions.handleMoveFolder(id, targetId),
          handleMoveReceipt: (id, targetId) =>
            void receiptActions.handleMoveReceipt(id, targetId),
        }}
        sideContent={
          <AnimatePresence>
            {state.viewingReceipt && (
              <ReceiptDetailPanel
                key="receipt-detail"
                receipt={state.viewingReceipt}
                onClose={() => state.setViewingReceipt(null)}
                onDelete={(id) => void receiptActions.handleDeleteReceipt(id)}
              />
            )}
          </AnimatePresence>
        }
        editingId={editingId}
        onStartEditing={handleStartEditing}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onDeleteItems={handleDeleteItems}
        onEscape={handleEscape}
        enableRubberBand
        scanningCount={scanningCount}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={(name) => void folderActions.handleCreateFolder(name)}
      />
    </>
  );
}
