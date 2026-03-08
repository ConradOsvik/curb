import type { Id } from "@curb/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";

import { BackgroundContextMenu } from "@/components/dashboard/context-menus/background-context-menu";
import { CreateFolderDialog } from "@/components/dashboard/dialogs/create-folder-dialog";
import { DeleteDialog } from "@/components/dashboard/dialogs/delete-dialog";
import { ReceiptDetailModal } from "@/components/dashboard/dialogs/receipt-detail-modal";
import { RenameDialog } from "@/components/dashboard/dialogs/rename-dialog";
import { FileExplorerDndContext } from "@/components/dashboard/dnd/file-explorer-dnd-context";
import { SelectionBox } from "@/components/dashboard/dnd/selection-box";
import { useSelection } from "@/components/dashboard/dnd/use-selection";
import { FileExplorerCardGrid } from "@/components/dashboard/file-explorer/file-explorer-card-grid";
import { FileExplorerTable } from "@/components/dashboard/file-explorer/file-explorer-table";
import { FileExplorerToolbar } from "@/components/dashboard/file-explorer/file-explorer-toolbar";
import { UploadDropzone } from "@/components/dashboard/file-explorer/upload-dropzone";
import {
  useDashboardMutations,
  useDashboardQueries,
  useDashboardState,
  useFileUpload,
  useFolderActions,
  useReceiptActions,
} from "@/hooks/use-dashboard";
import { useViewPreference } from "@/hooks/use-view-preference";

interface DashboardSearch {
  folder?: string;
}

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    folder: (search.folder as string) || undefined,
  }),
});

function DashboardPage() {
  const state = useDashboardState();
  const queries = useDashboardQueries(state.currentFolderId);
  const mutations = useDashboardMutations();
  const folderActions = useFolderActions(mutations, state);
  const receiptActions = useReceiptActions(mutations, state.currentFolderId);
  const { handleUpload, scanningCount } = useFileUpload(
    mutations,
    state.currentFolderId
  );
  const { view, setView } = useViewPreference();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefsRef = useRef<Map<string, HTMLElement>>(new Map());

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: Id<"folders">;
    name: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "folder" | "receipt";
  } | null>(null);

  const selectableItems = useMemo(
    () =>
      queries.items.map((entry) => ({
        id: entry.item._id,
        type: entry.type,
      })),
    [queries.items]
  );

  const selection = useSelection({ items: selectableItems });

  // Get parent folder ID from the path for ".." navigation
  const parentFolderId = useMemo(() => {
    if (queries.path.length >= 2) {
      return queries.path.at(-2)!._id;
    }
    return;
  }, [queries.path]);

  const handleNavigate = useCallback(
    (folderId?: Id<"folders">) => {
      state.setCurrentFolderId(folderId);
      selection.clearSelection();
    },
    [state, selection]
  );

  const handleBackgroundClick = useCallback(() => {
    selection.clearSelection();
  }, [selection]);

  const setItemRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      itemRefsRef.current.set(id, el);
    } else {
      itemRefsRef.current.delete(id);
    }
  }, []);

  const handleRenameFolder = useCallback(
    (folderId: Id<"folders">, name: string) => {
      setRenameTarget({ id: folderId, name });
    },
    []
  );

  const handleDeleteFolder = useCallback(
    (folderId: Id<"folders">) => {
      const folder = queries.folders.find((f) => f._id === folderId);
      setDeleteTarget({
        id: folderId,
        name: folder?.name ?? "Folder",
        type: "folder",
      });
    },
    [queries.folders]
  );

  const handleDeleteReceipt = useCallback(
    (receiptId: Id<"receipts">) => {
      const receipt = queries.receipts.find((r) => r._id === receiptId);
      setDeleteTarget({
        id: receiptId,
        name: receipt?.merchantName ?? "Receipt",
        type: "receipt",
      });
    },
    [queries.receipts]
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) {
      return;
    }
    if (deleteTarget.type === "folder") {
      folderActions.handleDeleteFolder(deleteTarget.id as Id<"folders">);
    } else {
      receiptActions.handleDeleteReceipt(deleteTarget.id as Id<"receipts">);
    }
    setDeleteTarget(null);
  }, [deleteTarget, folderActions, receiptActions]);

  const viewProps = {
    allFolders: queries.allFolders,
    currentFolderId: state.currentFolderId,
    isSelected: selection.isSelected,
    items: queries.items,
    onChangeFolderColor: folderActions.handleChangeFolderColor,
    onDeleteFolder: handleDeleteFolder,
    onDeleteReceipt: handleDeleteReceipt,
    onMoveFolder: folderActions.handleMoveFolder,
    onMoveReceipt: receiptActions.handleMoveReceipt,
    onNavigate: handleNavigate,
    onRenameFolder: handleRenameFolder,
    onSelect: selection.handleClick,
    onViewReceipt: state.setViewingReceipt,
    parentFolderId,
    scanningCount,
    setItemRef,
  };

  return (
    <div className="flex h-full flex-col">
      <FileExplorerToolbar
        path={queries.path}
        view={view}
        onViewChange={setView}
        onNewFolder={() => setCreateFolderOpen(true)}
        onUpload={() => fileInputRef.current?.click()}
        onNavigate={handleNavigate}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <div className="flex-1 overflow-hidden">
        <UploadDropzone
          currentFolderId={state.currentFolderId}
          className="h-full"
        >
          <BackgroundContextMenu
            onNewFolder={() => setCreateFolderOpen(true)}
            onUploadReceipt={() => fileInputRef.current?.click()}
          >
            <FileExplorerDndContext
              items={queries.items}
              parentFolderId={parentFolderId}
              selectedIds={selection.selectedIds}
              view={view}
              onMoveFolder={folderActions.handleMoveFolder}
              onMoveReceipt={receiptActions.handleMoveReceipt}
              onReorder={folderActions.handleReorder}
            >
              {(orderedItems, dropIntoTarget) => (
                <div
                  ref={containerRef}
                  role="listbox"
                  tabIndex={0}
                  className="relative flex h-full flex-col outline-none"
                  onClick={handleBackgroundClick}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      selection.clearSelection();
                    }
                  }}
                >
                  <SelectionBox
                    containerRef={containerRef}
                    itemRefs={itemRefsRef.current}
                    onSelectionChange={selection.handleRubberBandSelect}
                  />

                  {view === "list" ? (
                    <FileExplorerTable
                      {...viewProps}
                      items={orderedItems}
                      dropIntoTarget={dropIntoTarget}
                    />
                  ) : (
                    <FileExplorerCardGrid
                      {...viewProps}
                      items={orderedItems}
                      dropIntoTarget={dropIntoTarget}
                    />
                  )}
                </div>
              )}
            </FileExplorerDndContext>
          </BackgroundContextMenu>
        </UploadDropzone>
      </div>

      <ReceiptDetailModal
        receipt={state.viewingReceipt}
        onClose={() => state.setViewingReceipt(null)}
        onDelete={receiptActions.handleDeleteReceipt}
        onMove={receiptActions.handleMoveReceipt}
        folders={queries.allFolders}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={folderActions.handleCreateFolder}
      />

      {renameTarget && (
        <RenameDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setRenameTarget(null);
            }
          }}
          currentName={renameTarget.name}
          onRename={(name) =>
            folderActions.handleRenameFolder(renameTarget.id, name)
          }
        />
      )}

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        itemName={deleteTarget?.name ?? ""}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
