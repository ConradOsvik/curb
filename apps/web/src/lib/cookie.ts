export type CookieCategory =
  | "necessary"
  | "functional"
  | "analytics"
  | "marketing";

// Necessary cookies are always allowed. Other categories return true
// until a consent banner is integrated — check stored consent here then.
export function hasConsent(category: CookieCategory): boolean {
  if (category === "necessary") {
    return true;
  }
  return true;
}

// Parse a cookie value from a cookie header string (server or client).
export function parseCookie(cookieHeader: string, name: string): string | null {
  const escaped = name.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`));
  return match?.[1] ?? null;
}

interface WriteCookieOptions {
  maxAge?: number;
  path?: string;
  sameSite?: "Lax" | "None" | "Strict";
  category?: CookieCategory;
}

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// Set a cookie on the client. Returns false without writing if the user
// has not consented to the given category (React state still works, just
// no persistence across refreshes).
export function writeCookie(
  name: string,
  value: string,
  options: WriteCookieOptions = {}
): boolean {
  const {
    maxAge = DEFAULT_MAX_AGE,
    path = "/",
    sameSite = "Lax",
    category = "functional",
  } = options;

  if (typeof document === "undefined" || !hasConsent(category)) {
    return false;
  }

  // oxlint-disable-next-line unicorn/no-document-cookie
  document.cookie = `${name}=${value}; path=${path}; max-age=${maxAge}; SameSite=${sameSite}`;
  return true;
}

// Delete a cookie by setting max-age to 0. Useful for consent revocation.
export function deleteCookie(name: string, path = "/"): void {
  if (typeof document === "undefined") {
    return;
  }
  // oxlint-disable-next-line unicorn/no-document-cookie
  document.cookie = `${name}=; path=${path}; max-age=0`;
}
