import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import type { Theme } from "@/components/theme-provider";
import { parseCookie } from "@/lib/cookie";

export const getTheme = createServerFn({ method: "GET" }).handler((): Theme => {
  const cookie = (getRequestHeaders() as Headers).get("cookie") ?? "";
  const value = parseCookie(cookie, "ui-theme");
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
});
