import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function measure(el: HTMLElement, container: HTMLElement): Rect {
  const cr = container.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return {
    height: er.height,
    left: er.left - cr.left,
    top: er.top - cr.top,
    width: er.width,
  };
}

const springTransition = {
  damping: 30,
  stiffness: 500,
  type: "spring" as const,
};

// ---------------------------------------------------------------------------
// HoverHighlight — free-floating, multi-instance (menus, dropdowns, selects)
// ---------------------------------------------------------------------------

interface HoverHighlightContextValue {
  onItemEnter: (el: HTMLElement) => void;
}

const HoverHighlightContext = createContext<HoverHighlightContextValue | null>(
  null
);

export function useHoverHighlight() {
  return useContext(HoverHighlightContext);
}

let nextKey = 0;

function getNextKey() {
  nextKey += 1;
  return nextKey;
}

export function HoverHighlightRoot({
  children,
  className,
  highlightClassName = "bg-foreground/[0.06] rounded-md",
}: {
  children: ReactNode;
  className?: string;
  highlightClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<(Rect & { key: number }) | null>(
    null
  );
  const isInsideRef = useRef(false);

  const onItemEnter = useCallback((el: HTMLElement) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const rect = measure(el, container);

    if (isInsideRef.current) {
      setHighlight((prev) =>
        prev ? { ...prev, ...rect } : { ...rect, key: getNextKey() }
      );
    } else {
      isInsideRef.current = true;
      setHighlight({ ...rect, key: getNextKey() });
    }
  }, []);

  const onContainerLeave = useCallback(() => {
    isInsideRef.current = false;
    setHighlight(null);
  }, []);

  const contextValue = useMemo(() => ({ onItemEnter }), [onItemEnter]);

  return (
    <HoverHighlightContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        onMouseLeave={onContainerLeave}
        className={cn("relative", className)}
      >
        <AnimatePresence>
          {highlight && (
            <motion.span
              key={highlight.key}
              initial={{ ...highlight, opacity: 0 }}
              animate={{ ...highlight, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                height: springTransition,
                left: springTransition,
                opacity: { duration: 0.15, ease: "easeOut" },
                top: springTransition,
                width: springTransition,
              }}
              className={cn(
                "pointer-events-none absolute -z-[1]",
                highlightClassName
              )}
            />
          )}
        </AnimatePresence>
        {children}
      </div>
    </HoverHighlightContext.Provider>
  );
}

export function HoverHighlightItem({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = useContext(HoverHighlightContext);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        if (ref.current && ctx) {
          ctx.onItemEnter(ref.current);
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActiveHoverHighlight — single anchored instance (sidebar, tabs, segments)
// Rests on the active item. Slides to hovered item. Returns on mouse leave.
// ---------------------------------------------------------------------------

interface ActiveHoverHighlightContextValue {
  onItemHover: (el: HTMLElement) => void;
  registerActive: (el: HTMLElement) => void;
}

const ActiveHoverHighlightContext =
  createContext<ActiveHoverHighlightContextValue | null>(null);

export function useActiveHoverHighlight() {
  return useContext(ActiveHoverHighlightContext);
}

export function ActiveHoverHighlightRoot({
  children,
  className,
  highlightClassName = "bg-accent",
}: {
  children: ReactNode;
  className?: string;
  highlightClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeElRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<Rect | null>(null);

  const measureFromContainer = useCallback((el: HTMLElement): Rect | null => {
    const container = containerRef.current;
    if (!container) {
      return null;
    }
    return measure(el, container);
  }, []);

  const registerActive = useCallback(
    (el: HTMLElement) => {
      activeElRef.current = el;
      const rect = measureFromContainer(el);
      if (rect) {
        setPosition(rect);
      }
    },
    [measureFromContainer]
  );

  const onItemHover = useCallback(
    (el: HTMLElement) => {
      const rect = measureFromContainer(el);
      if (rect) {
        setPosition(rect);
      }
    },
    [measureFromContainer]
  );

  const onContainerLeave = useCallback(() => {
    const activeEl = activeElRef.current;
    if (activeEl) {
      const rect = measureFromContainer(activeEl);
      if (rect) {
        setPosition(rect);
      }
    }
  }, [measureFromContainer]);

  const contextValue = useMemo(
    () => ({ onItemHover, registerActive }),
    [onItemHover, registerActive]
  );

  return (
    <ActiveHoverHighlightContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        onMouseLeave={onContainerLeave}
        className={cn("relative", className)}
      >
        {position && (
          <motion.span
            initial={false}
            animate={{
              height: position.height,
              left: position.left,
              top: position.top,
              width: position.width,
            }}
            transition={springTransition}
            className={cn(
              "pointer-events-none absolute -z-[1] rounded-md",
              highlightClassName
            )}
          />
        )}
        {children}
      </div>
    </ActiveHoverHighlightContext.Provider>
  );
}
