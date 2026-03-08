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
  const [isDragging, setIsDragging] = useState(false);
  const [box, setBox] = useState<BoxCoords | null>(null);
  const isAdditiveRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (disabled) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      // Only start if clicking on empty space (the container itself)
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

      isAdditiveRef.current = e.ctrlKey || e.metaKey;
      setIsDragging(true);
      setBox({
        endX: startX,
        endY: startY,
        startX,
        startY,
      });
    },
    [containerRef, itemRefs, disabled]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !box) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const endX = e.clientX - containerRect.left + container.scrollLeft;
      const endY = e.clientY - containerRect.top + container.scrollTop;

      setBox((prev) => (prev ? { ...prev, endX, endY } : null));

      // Calculate which items intersect with the selection box
      const selectionRect = {
        bottom: Math.max(box.startY, endY),
        left: Math.min(box.startX, endX),
        right: Math.max(box.startX, endX),
        top: Math.min(box.startY, endY),
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
    [isDragging, box, containerRef, itemRefs, onSelectionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setBox(null);
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

  if (!isDragging || !box) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute z-10 border border-primary/50 bg-primary/10"
      style={getBoxStyle(box)}
    />
  );
}
