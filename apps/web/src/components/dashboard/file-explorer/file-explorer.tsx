import type { ReceiptWithItems } from "@curb/api";
import { useHotkey } from "@tanstack/react-hotkeys";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";

import type { ExplorerItem } from "@/hooks/use-dashboard";
import { useViewPreference } from "@/hooks/use-view-preference";

import { FileExplorerDndContext } from "../dnd/file-explorer-dnd-context";
import { SelectionBox } from "../dnd/selection-box";
import { useSelection } from "../dnd/use-selection";
import {
  FileExplorerCardGrid,
  type ItemWrapperProps,
} from "./file-explorer-card-grid";
import { FileExplorerTable } from "./file-explorer-table";
import {
  type BreadcrumbItemProps,
  FileExplorerToolbar,
} from "./file-explorer-toolbar";

export type { ItemWrapperProps, BreadcrumbItemProps };

interface DndConfig {
  handleMoveFolder: (folderId: string, targetFolderId?: string) => void;
  handleMoveReceipt: (receiptId: string, targetFolderId?: string) => void;
}

interface FileExplorerProps {
  items: ExplorerItem[];
  path: { id: string; name: string }[];
  currentFolderId?: string;
  parentFolderId?: string;
  onNavigate: (folderId?: string) => void;
  onViewReceipt: (receipt: ReceiptWithItems) => void;

  renderItemWrapper: (props: ItemWrapperProps) => ReactNode;
  renderParentCard?: (onNavigate: () => void) => ReactNode;
  renderParentRow?: (onNavigate: () => void) => ReactNode;

  contentWrapper?: (children: ReactNode) => ReactNode;

  rootIcon?: ReactNode;
  rootLabel?: string;
  toolbarActions?: ReactNode;
  BreadcrumbComponent?: ComponentType<BreadcrumbItemProps>;

  dndConfig?: DndConfig;
  sideContent?: ReactNode;

  editingId?: string | null;
  onStartEditing?: (id: string) => void;
  onSaveEdit?: (id: string, name: string) => void;
  onCancelEdit?: () => void;

  onDeleteItems?: (ids: Set<string>) => void;
  onEscape?: () => boolean;

  enableRubberBand?: boolean;
  scanningCount?: number;
  emptyIcon?: ReactNode;
  emptyMessage?: string;
}

export function FileExplorer({
  items,
  path,
  currentFolderId,
  parentFolderId,
  onNavigate: onNavigateProp,
  onViewReceipt,
  renderItemWrapper,
  renderParentCard,
  renderParentRow,
  contentWrapper,
  rootIcon,
  rootLabel,
  toolbarActions,
  BreadcrumbComponent,
  dndConfig,
  sideContent,
  editingId = null,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onDeleteItems,
  onEscape,
  enableRubberBand = false,
  scanningCount = 0,
  emptyIcon,
  emptyMessage,
}: FileExplorerProps) {
  const { view, setView } = useViewPreference();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefsRef = useRef<Map<string, HTMLElement>>(new Map());
  const pointerModifierRef = useRef(false);

  const selectableItems = useMemo(
    () => items.map((entry) => ({ id: entry.item.id, type: entry.type })),
    [items]
  );

  const selection = useSelection({ items: selectableItems });

  const handleNavigate = useCallback(
    (folderId?: string) => {
      onNavigateProp(folderId);
      selection.clearSelection();
    },
    [onNavigateProp, selection]
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

  const handleFocusItem = useCallback(
    (id: string) => {
      if (!selection.selectedIds.has(id) && !pointerModifierRef.current) {
        selection.selectSingle(id);
      }
    },
    [selection]
  );

  // --- Keyboard shortcuts ---

  const focusItem = useCallback(
    (id: string | undefined) => {
      if (!id) {
        return;
      }
      selection.selectSingle(id);
      const el = itemRefsRef.current.get(id);
      const focusable = el?.querySelector<HTMLElement>("[tabindex='0']");
      (focusable ?? el)?.focus();
    },
    [selection]
  );

  const navigateItems = useCallback(
    (direction: 1 | -1) => {
      const itemIds = items.map((entry) => entry.item.id);
      if (itemIds.length === 0) {
        return;
      }

      if (selection.selectedIds.size === 0) {
        focusItem(direction === 1 ? itemIds[0] : itemIds.at(-1));
        return;
      }

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
    [items, selection.selectedIds, focusItem]
  );

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

  useHotkey(
    "Enter",
    (e) => {
      if (selection.selectedIds.size !== 1 || !onStartEditing) {
        return;
      }
      e.preventDefault();
      const [id] = [...selection.selectedIds];
      onStartEditing(id);
    },
    { enabled: editingId === null }
  );

  useHotkey(
    "Mod+ArrowDown",
    (e) => {
      if (selection.selectedIds.size !== 1) {
        return;
      }
      e.preventDefault();
      const [id] = [...selection.selectedIds];
      const item = items.find((entry) => entry.item.id === id);
      if (item?.type === "folder") {
        handleNavigate(id);
      } else if (item?.type === "receipt") {
        onViewReceipt(item.item as ReceiptWithItems);
      }
    },
    { enabled: editingId === null }
  );

  useHotkey(
    "Mod+ArrowUp",
    (e) => {
      if (!currentFolderId) {
        return;
      }
      e.preventDefault();
      handleNavigate(parentFolderId);
    },
    { enabled: editingId === null }
  );

  useHotkey("Escape", () => {
    if (editingId) {
      onCancelEdit?.();
    } else if (onEscape?.()) {
      // onEscape handled it (e.g. closed receipt panel)
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

  useHotkey(
    "Mod+Backspace",
    (e) => {
      if (selection.selectedIds.size === 0 || !onDeleteItems) {
        return;
      }
      e.preventDefault();
      onDeleteItems(selection.selectedIds);
      selection.clearSelection();
    },
    { enabled: editingId === null }
  );

  const viewProps = {
    currentFolderId,
    editingId,
    emptyIcon,
    emptyMessage,
    isSelected: selection.isSelected,
    items,
    onCancelEdit,
    onFocusItem: handleFocusItem,
    onNavigate: handleNavigate,
    onSaveEdit,
    onSelect: selection.handleClick,
    onViewReceipt,
    parentFolderId,
    renderItemWrapper,
    scanningCount,
    setItemRef,
  };

  const renderLayout = (dropIntoTarget: string | null) => {
    const content = (
      <div
        role="presentation"
        ref={containerRef}
        className="relative flex h-full flex-col overflow-hidden"
        onClick={handleBackgroundClick}
        onPointerDown={(e) => {
          pointerModifierRef.current = e.metaKey || e.ctrlKey || e.shiftKey;
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            handleBackgroundClick();
          }
        }}
      >
        {enableRubberBand && (
          <SelectionBox
            containerRef={containerRef}
            itemRefs={itemRefsRef.current}
            onSelectionChange={selection.handleRubberBandSelect}
            disabled={editingId !== null}
          />
        )}

        {view === "list" ? (
          <FileExplorerTable
            {...viewProps}
            dropIntoTarget={dropIntoTarget}
            renderParentRow={renderParentRow}
          />
        ) : (
          <FileExplorerCardGrid
            {...viewProps}
            dropIntoTarget={dropIntoTarget}
            renderParentCard={renderParentCard}
          />
        )}
      </div>
    );

    const wrappedContent = contentWrapper ? contentWrapper(content) : content;

    return (
      <>
        <FileExplorerToolbar
          path={path}
          view={view}
          onViewChange={setView}
          onNavigate={handleNavigate}
          rootIcon={rootIcon}
          rootLabel={rootLabel}
          actions={toolbarActions}
          BreadcrumbComponent={BreadcrumbComponent}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">{wrappedContent}</div>
          {sideContent}
        </div>
      </>
    );
  };

  if (dndConfig) {
    return (
      <div className="flex h-full flex-col">
        <FileExplorerDndContext
          items={items}
          itemRefs={itemRefsRef.current}
          parentFolderId={parentFolderId}
          selectedIds={selection.selectedIds}
          view={view}
          onMoveFolder={dndConfig.handleMoveFolder}
          onMoveReceipt={dndConfig.handleMoveReceipt}
        >
          {(dropIntoTarget) => renderLayout(dropIntoTarget)}
        </FileExplorerDndContext>
      </div>
    );
  }

  return <div className="flex h-full flex-col">{renderLayout(null)}</div>;
}
