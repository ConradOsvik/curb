import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { parseCookie } from "@/lib/cookie";

export const getSidebarState = createServerFn({ method: "GET" }).handler(
  (): boolean => {
    const cookie = (getRequestHeaders() as Headers).get("cookie") ?? "";
    return parseCookie(cookie, "sidebar_state") !== "false";
  }
);
