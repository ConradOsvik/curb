import { useCallback, useState } from "react";

export interface SelectableItem {
  id: string;
  type: "folder" | "receipt";
}

interface UseSelectionOptions {
  items: SelectableItem[];
}

interface UseSelectionReturn {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  handleClick: (id: string, event: React.MouseEvent) => void;
  handleSelectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  handleRubberBandSelect: (ids: string[], additive: boolean) => void;
}

export function useSelection({
  items,
}: UseSelectionOptions): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const handleClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.stopPropagation();

      if (event.shiftKey && lastSelectedId) {
        // Range select from last selected to current
        const itemIds = items.map((item) => item.id);
        const lastIndex = itemIds.indexOf(lastSelectedId);
        const currentIndex = itemIds.indexOf(id);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const rangeIds = itemIds.slice(start, end + 1);

          if (event.ctrlKey || event.metaKey) {
            // Add range to existing selection
            setSelectedIds((prev) => {
              const next = new Set(prev);
              for (const rangeId of rangeIds) {
                next.add(rangeId);
              }
              return next;
            });
          } else {
            // Replace selection with range
            setSelectedIds(new Set(rangeIds));
          }
        }
      } else if (event.ctrlKey || event.metaKey) {
        // Toggle item in selection
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        setLastSelectedId(id);
      } else {
        // Single select, clear others
        setSelectedIds(new Set([id]));
        setLastSelectedId(id);
      }
    },
    [items, lastSelectedId]
  );

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const handleRubberBandSelect = useCallback(
    (ids: string[], additive: boolean) => {
      if (additive) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of ids) {
            next.add(id);
          }
          return next;
        });
      } else {
        setSelectedIds(new Set(ids));
      }
    },
    []
  );

  return {
    clearSelection,
    handleClick,
    handleRubberBandSelect,
    handleSelectAll,
    isSelected,
    lastSelectedId,
    selectedIds,
  };
}
