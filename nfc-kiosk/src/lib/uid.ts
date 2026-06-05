// src/lib/uid.ts

/**
 * Normalise a UID from any common format to uppercase hex with no separators.
 * e.g.  "04:03:2a:92:d4:13:91"  →  "04032A92D41391"
 *       "04 03 2A 92 D4 13 91"  →  "04032A92D41391"
 *       "04032a92d41391"         →  "04032A92D41391"
 */
export function normalizeUID(raw: string): string {
  return raw.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
}

/**
 * Basic UID sanity check: must be 4–20 hex chars (2–10 bytes).
 */
export function isValidUID(uid: string): boolean {
  return /^[0-9A-F]{4,20}$/.test(uid);
}

/**
 * Validate that a URL is http:// or https://.
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
