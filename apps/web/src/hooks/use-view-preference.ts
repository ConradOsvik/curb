import { useCallback, useEffect, useState } from "react";

type ViewMode = "grid" | "list";

const STORAGE_KEY = "curb-view-mode";

export function useViewPreference() {
  const [view, setViewState] = useState<ViewMode>("list");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (stored) {
      setViewState(stored);
    }
  }, []);

  const setView = useCallback((mode: ViewMode) => {
    setViewState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return { setView, view };
}
