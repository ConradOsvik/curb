import { useCallback, useEffect, useRef, useState } from "react";

interface SelectionBoxProps {
  containerRef: React.RefObject<HTMLElement | null>;
  itemRefs: Map<string, HTMLElement>;
  onSelectionChange: (ids: string[], additive: boolean) => void;
  disabled?: boolean;
}

interface BoxCoords {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

function getBoxStyle(box: BoxCoords) {
  const left = Math.min(box.startX, box.endX);
  const top = Math.min(box.startY, box.endY);
  const width = Math.abs(box.endX - box.startX);
  const height = Math.abs(box.endY - box.startY);

  return {
    height: `${height}px`,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
}

function rectsIntersect(
  rect1: { left: number; top: number; right: number; bottom: number },
  rect2: { left: number; top: number; right: number; bottom: number }
) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

export function SelectionBox({
  containerRef,
  itemRefs,
  onSelectionChange,
  disabled,
}: SelectionBoxProps) {
  const [box, setBox] = useState<BoxCoords | null>(null);
  const isDraggingRef = useRef(false);
  const boxRef = useRef<BoxCoords | null>(null);
  const isAdditiveRef = useRef(false);
  const didDragSelectRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (disabled || e.button !== 0) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const target = e.target as HTMLElement;

      // Check if we clicked on an item or its descendants
      for (const [, element] of itemRefs) {
        if (element.contains(target)) {
          return;
        }
      }

      // Check if target is an interactive element
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input")
      ) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const startX = e.clientX - containerRect.left + container.scrollLeft;
      const startY = e.clientY - containerRect.top + container.scrollTop;

      e.preventDefault();
      isAdditiveRef.current = e.ctrlKey || e.metaKey;
      didDragSelectRef.current = false;

      const coords: BoxCoords = {
        endX: startX,
        endY: startY,
        startX,
        startY,
      };

      isDraggingRef.current = true;
      boxRef.current = coords;
      setBox(coords);
    },
    [containerRef, itemRefs, disabled]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !boxRef.current) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const endX = Math.max(
        0,
        Math.min(
          e.clientX - containerRect.left + container.scrollLeft,
          container.scrollWidth
        )
      );
      const endY = Math.max(
        0,
        Math.min(
          e.clientY - containerRect.top + container.scrollTop,
          container.scrollHeight
        )
      );

      const { startX } = boxRef.current;
      const { startY } = boxRef.current;

      const newBox: BoxCoords = { endX, endY, startX, startY };
      boxRef.current = newBox;
      setBox(newBox);

      // Check if we've moved enough to count as a drag selection (> 5px)
      const dx = Math.abs(endX - startX);
      const dy = Math.abs(endY - startY);
      if (dx > 5 || dy > 5) {
        didDragSelectRef.current = true;
      }

      // Calculate which items intersect with the selection box
      const selectionRect = {
        bottom: Math.max(startY, endY),
        left: Math.min(startX, endX),
        right: Math.max(startX, endX),
        top: Math.min(startY, endY),
      };

      const intersectingIds: string[] = [];

      for (const [id, element] of itemRefs) {
        const itemRect = element.getBoundingClientRect();
        const itemRelativeRect = {
          bottom: itemRect.bottom - containerRect.top + container.scrollTop,
          left: itemRect.left - containerRect.left + container.scrollLeft,
          right: itemRect.right - containerRect.left + container.scrollLeft,
          top: itemRect.top - containerRect.top + container.scrollTop,
        };

        if (rectsIntersect(selectionRect, itemRelativeRect)) {
          intersectingIds.push(id);
        }
      }

      onSelectionChange(intersectingIds, isAdditiveRef.current);
    },
    [containerRef, itemRefs, onSelectionChange]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) {
      return;
    }

    const wasDragSelect = didDragSelectRef.current;

    isDraggingRef.current = false;
    boxRef.current = null;
    didDragSelectRef.current = false;
    setBox(null);

    // After a rubber-band selection, prevent the background click from
    // immediately clearing the selection by eating the next click event
    if (wasDragSelect) {
      document.addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
        },
        { capture: true, once: true }
      );
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerRef, handleMouseDown, handleMouseMove, handleMouseUp]);

  if (!box) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute z-10 border border-blue-500/40 bg-blue-500/10"
      style={getBoxStyle(box)}
    />
  );
}
