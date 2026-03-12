import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import type { Theme } from "@/components/theme-provider";

/* oxlint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

export const getTheme = createServerFn({ method: "GET" }).handler((): Theme => {
  const headers = getRequestHeaders();
  const cookie = headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)ui-theme=(\w+)/);
  const value = match?.[1];
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
});
