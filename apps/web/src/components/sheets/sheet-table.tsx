import type { SheetWithData } from "@curb/api";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  type CellValue,
  DetailedCellError,
  type ExportedCellChange,
  HyperFormula,
} from "hyperformula";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const DEFAULT_ROWS = 100;
const DEFAULT_COLS = 26;
const COL_WIDTH = 100;
const ROW_HEIGHT = 28;
const ROW_HEADER_WIDTH = 46;
const MIN_COL_WIDTH = 40;
const MIN_ROW_HEIGHT = 20;

// ── Helpers ──────────────────────────────────────────────────────────

function colToLetter(col: number): string {
  let result = "";
  let n = col;
  do {
    result = String.fromCodePoint(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

type DisplayMap = Map<string, string>;
type SizeMap = Map<number, number>;

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function formatCellValue(val: CellValue): string {
  if (val === null || val === undefined) {
    return "";
  }
  if (val instanceof DetailedCellError) {
    return val.value;
  }
  if (typeof val === "boolean") {
    return val ? "TRUE" : "FALSE";
  }
  return String(val);
}

function buildInitialHF(cells: SheetWithData["cells"]): HyperFormula {
  // Build a sparse 2D array from DB cells
  let maxRow = 0;
  let maxCol = 0;
  for (const cell of cells) {
    if (cell.row > maxRow) {
      maxRow = cell.row;
    }
    if (cell.col > maxCol) {
      maxCol = cell.col;
    }
  }

  const data: (string | number | null)[][] = [];
  if (cells.length > 0) {
    for (let r = 0; r <= maxRow; r += 1) {
      const row: (string | number | null)[] = Array.from<null>({
        length: maxCol + 1,
      }).fill(null);
      data.push(row);
    }
    for (const cell of cells) {
      if (cell.value) {
        data[cell.row][cell.col] = cell.value;
      }
    }
  }

  return HyperFormula.buildFromArray(data, { licenseKey: "gpl-v3" });
}

function buildDisplayMap(hf: HyperFormula): DisplayMap {
  const map: DisplayMap = new Map();
  const dims = hf.getSheetDimensions(0);
  for (let r = 0; r < dims.height; r += 1) {
    for (let c = 0; c < dims.width; c += 1) {
      const val = hf.getCellValue({ col: c, row: r, sheet: 0 });
      const str = formatCellValue(val);
      if (str) {
        map.set(cellKey(r, c), str);
      }
    }
  }
  return map;
}

function applyChanges(
  prev: DisplayMap,
  changes: ExportedCellChange[]
): DisplayMap {
  if (changes.length === 0) {
    return prev;
  }
  const next = new Map(prev);
  for (const change of changes) {
    const key = cellKey(change.address.row, change.address.col);
    const str = formatCellValue(change.newValue);
    if (str) {
      next.set(key, str);
    } else {
      next.delete(key);
    }
  }
  return next;
}

function parseSizeMap(json: string | null | undefined): SizeMap {
  if (!json) {
    return new Map();
  }
  try {
    const obj = JSON.parse(json) as Record<string, number>;
    return new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));
  } catch {
    return new Map();
  }
}

function sizeMapToRecord(map: SizeMap): Record<number, number> {
  const obj: Record<number, number> = {};
  for (const [k, v] of map) {
    obj[k] = v;
  }
  return obj;
}

function sumSizes(upTo: number, sizes: SizeMap, defaultSize: number): number {
  let total = 0;
  for (let i = 0; i < upTo; i += 1) {
    total += sizes.get(i) ?? defaultSize;
  }
  return total;
}

// ── Types ────────────────────────────────────────────────────────────

interface CellCoord {
  row: number;
  col: number;
}

interface SelectionRange {
  start: CellCoord;
  end: CellCoord;
}

function normalizeRange(range: SelectionRange) {
  return {
    maxCol: Math.max(range.start.col, range.end.col),
    maxRow: Math.max(range.start.row, range.end.row),
    minCol: Math.min(range.start.col, range.end.col),
    minRow: Math.min(range.start.row, range.end.row),
  };
}

function isInRange(row: number, col: number, range: SelectionRange | null) {
  if (!range) {
    return false;
  }
  const { minRow, maxRow, minCol, maxCol } = normalizeRange(range);
  return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
}

function getCellCoords(
  target: EventTarget
): { row: number; col: number } | null {
  const el = (target as HTMLElement).closest<HTMLElement>("[data-row]");
  if (!el) {
    return null;
  }
  const row = Number(el.dataset.row);
  const col = Number(el.dataset.col);
  if (Number.isNaN(row) || Number.isNaN(col)) {
    return null;
  }
  return { col, row };
}

// ── Memoized cell ────────────────────────────────────────────────────

interface CellProps {
  row: number;
  col: number;
  value: string;
  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  left: number;
  width: number;
  height: number;
  onEditChange: (value: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onEditBlur: () => void;
}

const Cell = memo(function Cell({
  row,
  col,
  value,
  isActive,
  isSelected,
  isEditing,
  editValue,
  left,
  width,
  height,
  onEditChange,
  onEditKeyDown,
  onEditBlur,
}: CellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isEditing]);

  return (
    <div
      role="gridcell"
      data-row={row}
      data-col={col}
      className={cn(
        "absolute top-0 flex items-center border-b border-r px-1.5 text-sm",
        isActive && "z-[5] ring-2 ring-inset ring-primary",
        isSelected && !isActive && "bg-primary/10"
      )}
      style={{ height, left, width }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={onEditKeyDown}
          onBlur={onEditBlur}
          className="size-full bg-transparent text-sm outline-none"
        />
      ) : (
        <span className="truncate">{value}</span>
      )}
    </div>
  );
});

// ── Component ────────────────────────────────────────────────────────

export function SheetTable({ sheet }: { sheet: SheetWithData }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // HyperFormula engine — created once, lives in a ref
  const hfRef = useRef<HyperFormula | null>(null);
  if (!hfRef.current) {
    hfRef.current = buildInitialHF(sheet.cells);
  }

  // Display map — computed values from HF, only updated for changed cells
  const [displayMap, setDisplayMap] = useState<DisplayMap>(() => {
    const hf = hfRef.current;
    return hf ? buildDisplayMap(hf) : new Map();
  });

  // Selection
  const [activeCell, setActiveCell] = useState<CellCoord>({ col: 0, row: 0 });
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const isSelectingRef = useRef(false);
  const activeCellRef = useRef(activeCell);
  activeCellRef.current = activeCell;

  // Editing
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [editValue, setEditValue] = useState("");
  const editingCellRef = useRef(editingCell);
  editingCellRef.current = editingCell;
  const editValueRef = useRef(editValue);
  editValueRef.current = editValue;

  // Sizes — initialized from DB
  const [colWidths, setColWidths] = useState<SizeMap>(() =>
    parseSizeMap(sheet.colWidths)
  );
  const [rowHeights, setRowHeights] = useState<SizeMap>(() =>
    parseSizeMap(sheet.rowHeights)
  );
  const colWidthsRef = useRef(colWidths);
  colWidthsRef.current = colWidths;
  const rowHeightsRef = useRef(rowHeights);
  rowHeightsRef.current = rowHeights;
  const resizeRef = useRef<{
    type: "col" | "row";
    index: number;
    startPos: number;
    startSize: number;
  } | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ── Mutations ──────────────────────────────────────────────────────

  const updateCells = useMutation(
    trpc.sheets.updateCells.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [["sheets"]] });
      },
    })
  );

  const updateLayout = useMutation(
    trpc.sheets.updateLayout.mutationOptions({})
  );

  // ── Cell commit (HF + DB) ─────────────────────────────────────────

  const commitCell = useCallback(
    (row: number, col: number, value: string) => {
      const hf = hfRef.current;
      if (!hf) {
        return;
      }

      const addr = { col, row, sheet: 0 };
      const currentRaw = String(hf.getCellSerialized(addr) ?? "");
      if (value === currentRaw) {
        return;
      }

      // Update HF — returns all cells whose computed values changed
      const changes = hf.setCellContents(addr, value || null);
      const cellChanges = changes.filter(
        (c): c is ExportedCellChange => "address" in c
      );

      // Surgical displayMap update — only touched cells
      setDisplayMap((prev) => applyChanges(prev, cellChanges));

      // Persist raw value to DB
      updateCells.mutate({
        cells: [{ col, row, value }],
        sheetId: sheet.id,
      });
    },
    [sheet.id, updateCells]
  );

  // ── Editing (stable callbacks via refs) ────────────────────────────

  const commitEditRef = useRef(() => {});
  commitEditRef.current = () => {
    const ec = editingCellRef.current;
    if (!ec) {
      return;
    }
    commitCell(ec.row, ec.col, editValueRef.current);
    setEditingCell(null);
  };

  const startEditing = useCallback(
    (row: number, col: number, initialValue?: string) => {
      const hf = hfRef.current;
      // Read raw formula/value from HF (not computed value)
      const raw = hf
        ? String(hf.getCellSerialized({ col, row, sheet: 0 }) ?? "")
        : "";
      setEditingCell({ col, row });
      setEditValue(initialValue ?? raw);
    },
    []
  );

  const stableOnEditChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const stableOnEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    const ec = editingCellRef.current;
    if (!ec) {
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      commitEditRef.current();
      setActiveCell({
        col: ec.col,
        row: Math.min(ec.row + 1, DEFAULT_ROWS - 1),
      });
      setSelection(null);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingCell(null);
      containerRef.current?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEditRef.current();
      const nextCol = e.shiftKey
        ? Math.max(ec.col - 1, 0)
        : Math.min(ec.col + 1, DEFAULT_COLS - 1);
      setActiveCell({ col: nextCol, row: ec.row });
      setSelection(null);
    }
    e.stopPropagation();
  }, []);

  const stableOnEditBlur = useCallback(() => {
    commitEditRef.current();
  }, []);

  // ── Keyboard navigation (useHotkey) ────────────────────────────────

  const notEditing = editingCell === null;

  const navigate = useCallback(
    (rowDelta: number, colDelta: number, e: KeyboardEvent) => {
      e.preventDefault();
      const { row, col } = activeCellRef.current;
      const nextRow = Math.max(0, Math.min(row + rowDelta, DEFAULT_ROWS - 1));
      const nextCol = Math.max(0, Math.min(col + colDelta, DEFAULT_COLS - 1));

      if (e.shiftKey) {
        setSelection((prev) => ({
          end: { col: nextCol, row: nextRow },
          start: prev ? prev.start : activeCellRef.current,
        }));
      } else {
        setSelection(null);
      }

      setActiveCell({ col: nextCol, row: nextRow });
    },
    []
  );

  useHotkey("ArrowUp", (e) => navigate(-1, 0, e), {
    enabled: notEditing,
    target: containerRef,
  });
  useHotkey("ArrowDown", (e) => navigate(1, 0, e), {
    enabled: notEditing,
    target: containerRef,
  });
  useHotkey("ArrowLeft", (e) => navigate(0, -1, e), {
    enabled: notEditing,
    target: containerRef,
  });
  useHotkey("ArrowRight", (e) => navigate(0, 1, e), {
    enabled: notEditing,
    target: containerRef,
  });
  useHotkey("Shift+ArrowUp", (e) => navigate(-1, 0, e), {
    enabled: notEditing,
    target: containerRef,
  });
  useHotkey("Shift+ArrowDown", (e) => navigate(1, 0, e), {
    enabled: notEditing,
    target: containerRef,
  });
  useHotkey("Shift+ArrowLeft", (e) => navigate(0, -1, e), {
    enabled: notEditing,
    target: containerRef,
  });
  useHotkey("Shift+ArrowRight", (e) => navigate(0, 1, e), {
    enabled: notEditing,
    target: containerRef,
  });

  useHotkey(
    "Enter",
    (e) => {
      e.preventDefault();
      const { row, col } = activeCellRef.current;
      startEditing(row, col);
    },
    { enabled: notEditing, target: containerRef }
  );

  useHotkey(
    "Tab",
    (e) => {
      e.preventDefault();
      const { row, col } = activeCellRef.current;
      setActiveCell({ col: Math.min(col + 1, DEFAULT_COLS - 1), row });
      setSelection(null);
    },
    { enabled: notEditing, target: containerRef }
  );

  useHotkey(
    "Shift+Tab",
    (e) => {
      e.preventDefault();
      const { row, col } = activeCellRef.current;
      setActiveCell({ col: Math.max(col - 1, 0), row });
      setSelection(null);
    },
    { enabled: notEditing, target: containerRef }
  );

  const clearCells = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const hf = hfRef.current;
      if (!hf) {
        return;
      }

      if (selection) {
        const { minRow, maxRow, minCol, maxCol } = normalizeRange(selection);
        const dbChanges: { col: number; row: number; value: string }[] = [];

        const changes = hf.batch(() => {
          for (let r = minRow; r <= maxRow; r += 1) {
            for (let c = minCol; c <= maxCol; c += 1) {
              hf.setCellContents({ col: c, row: r, sheet: 0 }, null);
              dbChanges.push({ col: c, row: r, value: "" });
            }
          }
        });

        const cellChanges = changes.filter(
          (c): c is ExportedCellChange => "address" in c
        );
        setDisplayMap((prev) => applyChanges(prev, cellChanges));

        if (dbChanges.length > 0) {
          updateCells.mutate({ cells: dbChanges, sheetId: sheet.id });
        }
      } else {
        const { row, col } = activeCellRef.current;
        commitCell(row, col, "");
      }
    },
    [selection, commitCell, sheet.id, updateCells]
  );

  useHotkey("Delete", clearCells, {
    enabled: notEditing,
    target: containerRef,
  });
  useHotkey("Backspace", clearCells, {
    enabled: notEditing,
    target: containerRef,
  });

  useHotkey(
    "Escape",
    () => {
      if (editingCellRef.current) {
        setEditingCell(null);
        containerRef.current?.focus();
      } else {
        setSelection(null);
      }
    },
    { target: containerRef }
  );

  // Type-to-edit: catch printable characters on the container
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCellRef.current) {
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const { row, col } = activeCellRef.current;
        startEditing(row, col, e.key);
      }
    },
    [startEditing]
  );

  // ── Formula bar value (derived, no state) ──────────────────────────

  const formulaBarValue = useMemo(() => {
    const hf = hfRef.current;
    if (!hf) {
      return "";
    }
    return String(
      hf.getCellSerialized({
        col: activeCell.col,
        row: activeCell.row,
        sheet: 0,
      }) ?? ""
    );
    // displayMap in deps ensures we recalculate after HF updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCell.row, activeCell.col, displayMap]);

  // ── Resize (headers only, Excel-style) ─────────────────────────────

  const handleResizeStart = useCallback(
    (type: "col" | "row", index: number, startPos: number) => {
      const startSize =
        type === "col"
          ? (colWidthsRef.current.get(index) ?? COL_WIDTH)
          : (rowHeightsRef.current.get(index) ?? ROW_HEIGHT);

      resizeRef.current = { index, startPos, startSize, type };

      const handleMove = (e: MouseEvent) => {
        const r = resizeRef.current;
        if (!r) {
          return;
        }
        const delta =
          r.type === "col" ? e.clientX - r.startPos : e.clientY - r.startPos;
        const minSize = r.type === "col" ? MIN_COL_WIDTH : MIN_ROW_HEIGHT;
        const newSize = Math.max(minSize, r.startSize + delta);

        if (r.type === "col") {
          setColWidths((prev) => new Map([...prev, [r.index, newSize]]));
        } else {
          setRowHeights((prev) => new Map([...prev, [r.index, newSize]]));
        }
      };

      const handleUp = () => {
        resizeRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);

        updateLayout.mutate({
          colWidths: sizeMapToRecord(colWidthsRef.current),
          id: sheet.id,
          rowHeights: sizeMapToRecord(rowHeightsRef.current),
        });
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [sheet.id, updateLayout]
  );

  // ── Mouse (event delegation on container) ──────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") {
        return;
      }

      const resizeEl = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-resize]"
      );
      if (resizeEl) {
        e.preventDefault();
        const type = resizeEl.dataset.resize as "col" | "row";
        const index = Number(resizeEl.dataset.index);
        handleResizeStart(type, index, type === "col" ? e.clientX : e.clientY);
        return;
      }

      const coords = getCellCoords(e.target);
      if (!coords) {
        return;
      }

      if (editingCellRef.current) {
        commitEditRef.current();
      }

      if (e.shiftKey) {
        setSelection({
          end: coords,
          start: activeCellRef.current,
        });
      } else {
        setActiveCell(coords);
        setSelection(null);
        isSelectingRef.current = true;
      }

      containerRef.current?.focus();
    },
    [handleResizeStart]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelectingRef.current) {
      return;
    }
    if (e.buttons !== 1) {
      isSelectingRef.current = false;
      return;
    }
    const coords = getCellCoords(e.target);
    if (!coords) {
      return;
    }
    setSelection({
      end: coords,
      start: activeCellRef.current,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isSelectingRef.current = false;
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-resize]")) {
        return;
      }
      const coords = getCellCoords(e.target);
      if (coords) {
        startEditing(coords.row, coords.col);
      }
    },
    [startEditing]
  );

  // ── Virtualizer ──────────────────────────────────────────────────

  const getColWidth = useCallback(
    (index: number) => colWidths.get(index) ?? COL_WIDTH,
    [colWidths]
  );

  const getRowHeight = useCallback(
    (index: number) => rowHeights.get(index) ?? ROW_HEIGHT,
    [rowHeights]
  );

  const rowVirtualizer = useVirtualizer({
    count: DEFAULT_ROWS,
    estimateSize: getRowHeight,
    getScrollElement: () => tableContainerRef.current,
    overscan: 10,
  });

  const colVirtualizer = useVirtualizer({
    count: DEFAULT_COLS,
    estimateSize: getColWidth,
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: 5,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rowHeights, rowVirtualizer]);

  useEffect(() => {
    colVirtualizer.measure();
  }, [colWidths, colVirtualizer]);

  // Scroll active cell into view
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) {
      return;
    }

    const rh = rowHeightsRef.current;
    const cw = colWidthsRef.current;

    const cellTop = sumSizes(activeCell.row, rh, ROW_HEIGHT) + ROW_HEIGHT;
    const cellHeight = rh.get(activeCell.row) ?? ROW_HEIGHT;
    const cellBottom = cellTop + cellHeight;
    const viewTop = el.scrollTop + ROW_HEIGHT;
    const viewBottom = el.scrollTop + el.clientHeight;

    if (cellTop < viewTop) {
      el.scrollTop = cellTop - ROW_HEIGHT;
    } else if (cellBottom > viewBottom) {
      el.scrollTop = cellBottom - el.clientHeight;
    }

    const cellLeft = sumSizes(activeCell.col, cw, COL_WIDTH) + ROW_HEADER_WIDTH;
    const cellWidth = cw.get(activeCell.col) ?? COL_WIDTH;
    const cellRight = cellLeft + cellWidth;
    const viewLeft = el.scrollLeft + ROW_HEADER_WIDTH;
    const viewRight = el.scrollLeft + el.clientWidth;

    if (cellLeft < viewLeft) {
      el.scrollLeft = cellLeft - ROW_HEADER_WIDTH;
    } else if (cellRight > viewRight) {
      el.scrollLeft = cellRight - el.clientWidth;
    }
  }, [activeCell]);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualCols = colVirtualizer.getVirtualItems();

  const colLetters = useMemo(
    () => Array.from({ length: DEFAULT_COLS }, (_, i) => colToLetter(i)),
    []
  );

  return (
    <div
      ref={containerRef}
      role="grid"
      aria-label="Spreadsheet"
      className="flex flex-1 flex-col overflow-hidden outline-none"
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
    >
      {/* Formula bar */}
      <div className="flex items-center gap-2 border-b px-2 py-1">
        <div className="flex h-7 w-16 items-center justify-center rounded border bg-muted text-xs font-medium">
          {colLetters[activeCell.col]}
          {activeCell.row + 1}
        </div>
        <div className="mx-1 text-muted-foreground">
          <span className="text-xs italic">fx</span>
        </div>
        <div className="h-7 flex-1 rounded border bg-transparent px-2 text-sm leading-7">
          {formulaBarValue}
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        role="presentation"
        className="relative flex-1 overflow-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <div
          style={{
            height: rowVirtualizer.getTotalSize() + ROW_HEIGHT,
            position: "relative",
            width: colVirtualizer.getTotalSize() + ROW_HEADER_WIDTH,
          }}
        >
          {/* Column headers (sticky top) */}
          <div
            className="sticky top-0 z-20 flex border-b bg-muted"
            style={{ height: ROW_HEIGHT }}
          >
            <div
              className="sticky left-0 z-30 flex shrink-0 items-center justify-center border-b border-r bg-muted"
              style={{ height: ROW_HEIGHT, width: ROW_HEADER_WIDTH }}
            />
            <div
              style={{
                position: "relative",
                width: colVirtualizer.getTotalSize(),
              }}
            >
              {virtualCols.map((vc) => (
                <div
                  key={vc.key}
                  className="absolute top-0 flex items-center justify-center border-b border-r text-xs font-medium text-muted-foreground select-none"
                  style={{
                    height: ROW_HEIGHT,
                    left: vc.start,
                    width: vc.size,
                  }}
                >
                  {colLetters[vc.index]}
                  <div
                    data-resize="col"
                    data-index={vc.index}
                    className="absolute top-0 right-0 z-10 h-full w-1 translate-x-1/2 cursor-col-resize hover:bg-primary/40"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Body rows */}
          {virtualRows.map((vr) => {
            const rowH = vr.size;
            return (
              <div
                key={vr.key}
                className="absolute flex"
                style={{
                  height: rowH,
                  left: 0,
                  top: vr.start + ROW_HEIGHT,
                  width: colVirtualizer.getTotalSize() + ROW_HEADER_WIDTH,
                }}
              >
                {/* Row header */}
                <div
                  className="sticky left-0 z-10 flex shrink-0 items-center justify-center border-b border-r bg-muted text-xs text-muted-foreground select-none"
                  style={{
                    height: rowH,
                    position: "relative",
                    width: ROW_HEADER_WIDTH,
                  }}
                >
                  {vr.index + 1}
                  <div
                    data-resize="row"
                    data-index={vr.index}
                    className="absolute bottom-0 left-0 z-10 h-1 w-full translate-y-1/2 cursor-row-resize hover:bg-primary/40"
                  />
                </div>

                {/* Cells */}
                <div
                  style={{
                    position: "relative",
                    width: colVirtualizer.getTotalSize(),
                  }}
                >
                  {virtualCols.map((vc) => {
                    const rowIdx = vr.index;
                    const colIdx = vc.index;
                    const isEditing =
                      editingCell?.row === rowIdx &&
                      editingCell?.col === colIdx;

                    return (
                      <Cell
                        key={vc.key}
                        row={rowIdx}
                        col={colIdx}
                        value={displayMap.get(cellKey(rowIdx, colIdx)) ?? ""}
                        isActive={
                          activeCell.row === rowIdx && activeCell.col === colIdx
                        }
                        isSelected={isInRange(rowIdx, colIdx, selection)}
                        isEditing={isEditing}
                        editValue={isEditing ? editValue : ""}
                        left={vc.start}
                        width={vc.size}
                        height={rowH}
                        onEditChange={stableOnEditChange}
                        onEditKeyDown={stableOnEditKeyDown}
                        onEditBlur={stableOnEditBlur}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
