import type { Receipt } from "@curb/db/types";
import { useHotkey } from "@tanstack/react-hotkeys";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";

import { BackgroundContextMenu } from "@/components/dashboard/context-menus/background-context-menu";
import { CreateFolderDialog } from "@/components/dashboard/dialogs/create-folder-dialog";
import { ReceiptDetailModal } from "@/components/dashboard/dialogs/receipt-detail-modal";
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
  const { handleUpload, scanningCount, uploadFiles } = useFileUpload(
    mutations,
    state.currentFolderId
  );
  const { view, setView } = useViewPreference();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefsRef = useRef<Map<string, HTMLElement>>(new Map());

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectableItems = useMemo(
    () =>
      queries.items.map((entry) => ({
        id: entry.item.id,
        type: entry.type,
      })),
    [queries.items]
  );

  const selection = useSelection({ items: selectableItems });

  const parentFolderId = useMemo(
    () => (queries.path.length >= 2 ? queries.path.at(-2)?.id : undefined),
    [queries.path]
  );

  const handleNavigate = useCallback(
    (folderId?: string) => {
      state.setCurrentFolderId(folderId);
      selection.clearSelection();
      setEditingId(null);
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

  const handleStartEditing = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  const handleSaveEdit = useCallback(
    (id: string, name: string) => {
      folderActions.handleRenameFolder(id, name);
      setEditingId(null);
    },
    [folderActions]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  // Soft delete — instant, no confirmation needed (items go to Trash)
  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      folderActions.handleDeleteFolder(folderId);
      selection.clearSelection();
    },
    [folderActions, selection]
  );

  const handleDeleteReceipt = useCallback(
    (receiptId: string) => {
      receiptActions.handleDeleteReceipt(receiptId);
      selection.clearSelection();
    },
    [receiptActions, selection]
  );

  // --- Keyboard shortcuts ---

  const focusItem = useCallback(
    (id: string) => {
      selection.selectSingle(id);
      // Focus the DOM element so the focus ring appears
      const el = itemRefsRef.current.get(id);
      // The focusable element is nested inside the ref wrapper
      const focusable = el?.querySelector<HTMLElement>("[tabindex='0']");
      (focusable ?? el)?.focus();
    },
    [selection]
  );

  const navigateItems = useCallback(
    (direction: 1 | -1) => {
      const itemIds = queries.items.map((entry) => entry.item.id);
      if (itemIds.length === 0) {
        return;
      }

      if (selection.selectedIds.size === 0) {
        // Nothing selected: Down/Right → first, Up/Left → last
        focusItem(direction === 1 ? itemIds[0] : itemIds.at(-1));
        return;
      }

      // Find the last selected item's position and move from there
      const [currentId] = [...selection.selectedIds];
      const currentIndex = itemIds.indexOf(currentId);
      if (currentIndex === -1) {
        focusItem(direction === 1 ? itemIds[0] : itemIds.at(-1));
        return;
      }

      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= itemIds.length) {
        return;
      }

      focusItem(itemIds[nextIndex]);
    },
    [queries.items, selection.selectedIds, focusItem]
  );

  // Arrow Down/Right: focus next item
  useHotkey(
    "ArrowDown",
    (e) => {
      e.preventDefault();
      navigateItems(1);
    },
    { enabled: editingId === null }
  );

  useHotkey(
    "ArrowRight",
    (e) => {
      e.preventDefault();
      navigateItems(1);
    },
    { enabled: editingId === null }
  );

  // Arrow Up/Left: focus previous item
  useHotkey(
    "ArrowUp",
    (e) => {
      e.preventDefault();
      navigateItems(-1);
    },
    { enabled: editingId === null }
  );

  useHotkey(
    "ArrowLeft",
    (e) => {
      e.preventDefault();
      navigateItems(-1);
    },
    { enabled: editingId === null }
  );

  // Enter: rename selected item (macOS Finder behavior)
  useHotkey(
    "Enter",
    (e) => {
      if (selection.selectedIds.size !== 1) {
        return;
      }
      e.preventDefault();
      const [id] = [...selection.selectedIds];
      setEditingId(id);
    },
    { enabled: editingId === null }
  );

  // Cmd+Down: open selected folder or view selected receipt
  useHotkey(
    "Mod+ArrowDown",
    (e) => {
      if (selection.selectedIds.size !== 1) {
        return;
      }
      e.preventDefault();
      const [id] = [...selection.selectedIds];
      const item = queries.items.find((entry) => entry.item.id === id);
      if (item?.type === "folder") {
        handleNavigate(id);
      } else if (item?.type === "receipt") {
        state.setViewingReceipt(item.item as Receipt);
      }
    },
    { enabled: editingId === null }
  );

  // Cmd+Up: go to parent folder
  useHotkey(
    "Mod+ArrowUp",
    (e) => {
      if (!state.currentFolderId) {
        return;
      }
      e.preventDefault();
      handleNavigate(parentFolderId);
    },
    { enabled: editingId === null }
  );

  useHotkey("Escape", () => {
    if (editingId) {
      setEditingId(null);
    } else {
      selection.clearSelection();
    }
  });

  useHotkey(
    "Mod+A",
    (e) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName !== "INPUT" &&
        target.tagName !== "TEXTAREA" &&
        !target.isContentEditable
      ) {
        e.preventDefault();
        selection.handleSelectAll();
      }
    },
    { enabled: editingId === null }
  );

  // Cmd+Backspace: soft-delete selected items
  useHotkey(
    "Mod+Backspace",
    (e) => {
      if (selection.selectedIds.size === 0) {
        return;
      }
      e.preventDefault();

      for (const id of selection.selectedIds) {
        const item = queries.items.find((entry) => entry.item.id === id);
        if (item?.type === "folder") {
          folderActions.handleDeleteFolder(id);
        } else {
          receiptActions.handleDeleteReceipt(id);
        }
      }
      selection.clearSelection();
    },
    { enabled: editingId === null }
  );

  const viewProps = {
    allFolders: queries.allFolders,
    currentFolderId: state.currentFolderId,
    editingId,
    isSelected: selection.isSelected,
    items: queries.items,
    onCancelEdit: handleCancelEdit,
    onChangeFolderColor: folderActions.handleChangeFolderColor,
    onDeleteFolder: handleDeleteFolder,
    onDeleteReceipt: handleDeleteReceipt,
    onFocusItem: selection.selectSingle,
    onMoveFolder: folderActions.handleMoveFolder,
    onMoveReceipt: receiptActions.handleMoveReceipt,
    onNavigate: handleNavigate,
    onSaveEdit: handleSaveEdit,
    onSelect: selection.handleClick,
    onStartEditing: handleStartEditing,
    onViewReceipt: state.setViewingReceipt,
    parentFolderId,
    scanningCount,
    setItemRef,
  };

  return (
    <div className="flex h-full flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <FileExplorerDndContext
        items={queries.items}
        itemRefs={itemRefsRef.current}
        parentFolderId={parentFolderId}
        selectedIds={selection.selectedIds}
        view={view}
        onMoveFolder={folderActions.handleMoveFolder}
        onMoveReceipt={receiptActions.handleMoveReceipt}
      >
        {(dropIntoTarget) => (
          <>
            <FileExplorerToolbar
              path={queries.path}
              view={view}
              onViewChange={setView}
              onNewFolder={() => setCreateFolderOpen(true)}
              onUpload={() => fileInputRef.current?.click()}
              onNavigate={handleNavigate}
            />

            <div className="flex-1 overflow-hidden">
              <UploadDropzone onFiles={uploadFiles} className="h-full">
                <BackgroundContextMenu
                  onNewFolder={() => setCreateFolderOpen(true)}
                  onUploadReceipt={() => fileInputRef.current?.click()}
                >
                  <div
                    role="presentation"
                    ref={containerRef}
                    className="relative flex h-full flex-col overflow-hidden"
                    onClick={handleBackgroundClick}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        handleBackgroundClick(e as unknown as React.MouseEvent);
                      }
                    }}
                  >
                    <SelectionBox
                      containerRef={containerRef}
                      itemRefs={itemRefsRef.current}
                      onSelectionChange={selection.handleRubberBandSelect}
                      disabled={editingId !== null}
                    />

                    {view === "list" ? (
                      <FileExplorerTable
                        {...viewProps}
                        dropIntoTarget={dropIntoTarget}
                      />
                    ) : (
                      <FileExplorerCardGrid
                        {...viewProps}
                        dropIntoTarget={dropIntoTarget}
                      />
                    )}
                  </div>
                </BackgroundContextMenu>
              </UploadDropzone>
            </div>
          </>
        )}
      </FileExplorerDndContext>

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
    </div>
  );
}
