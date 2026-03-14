import { auth } from "@curb/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const getSession = createServerFn({ method: "GET" }).handler(() => {
  const headers = getRequestHeaders() as Headers;
  return auth.api.getSession({ headers });
});

export const refreshSession = createServerFn({ method: "GET" }).handler(() => {
  const headers = getRequestHeaders() as Headers;
  return auth.api.getSession({ headers, query: { disableCookieCache: true } });
});

export const ensureSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const headers = getRequestHeaders() as Headers;
    const session = await auth.api.getSession({ headers });
    if (!session) {
      throw new Error("Unauthorized");
    }
    return session;
  }
);

export const listSessions = createServerFn({ method: "GET" }).handler(() => {
  const headers = getRequestHeaders() as Headers;
  return auth.api.listSessions({ headers });
});

export const listPasskeys = createServerFn({ method: "GET" }).handler(() => {
  const headers = getRequestHeaders() as Headers;
  return auth.api.listPasskeys({ headers });
});
