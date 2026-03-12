import { createContext, use, useEffect, useMemo, useState } from "react";

export type ResolvedTheme = "dark" | "light";
export type Theme = ResolvedTheme | "system";

const COOKIE_KEY = "ui-theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

interface ThemeProviderState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  resolvedTheme: "light",
  setTheme: () => null,
  theme: "system",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (defaultTheme === "system") {
      return "light";
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function updateTheme() {
      const resolved =
        theme === "system" ? getSystemTheme() : (theme as ResolvedTheme);
      setResolvedTheme(resolved);
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
    }

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);
    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  const value = useMemo(
    () => ({
      resolvedTheme,
      setTheme: (newTheme: Theme) => {
        // oxlint-disable-next-line unicorn/no-document-cookie -- simple cookie set, no library needed
        document.cookie = `${COOKIE_KEY}=${newTheme}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
        setThemeState(newTheme);
      },
      theme,
    }),
    [theme, resolvedTheme]
  );

  return <ThemeProviderContext value={value}>{children}</ThemeProviderContext>;
}

export function useTheme() {
  const context = use(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
