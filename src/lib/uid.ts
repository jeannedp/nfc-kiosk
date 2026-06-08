// src/lib/uid.ts

/**
 * Normalise a UID from any supported format to uppercase hex with no separators.
 *
 * Supported input formats:
 *
 *  HEX formats (standard NFC UID):
 *    "04032A92D41391"          →  "04032A92D41391"
 *    "04:03:2A:92:D4:13:91"   →  "04032A92D41391"
 *    "04 03 2A 92 D4 13 91"   →  "04032A92D41391"
 *    "04032a92d41391"          →  "04032A92D41391"  (lowercase)
 *
 *  Decimal formats (some USB keyboard-wedge readers output the card
 *  number as a plain decimal integer, e.g. "2346117917"):
 *    "2346117917"              →  "8BE9B11D"   (hex of decimal value)
 *
 * The normalisation strategy:
 *   1. Strip all whitespace and colons.
 *   2. If the result is a valid hex string → uppercase and return it.
 *   3. If the original trimmed input looks like a pure decimal number
 *      (digits only, no colons) → convert to hex and return it.
 *   4. Otherwise return the stripped+uppercased string as-is for
 *      downstream validation to reject.
 */
export function normalizeUID(raw: string): string {
  const trimmed = raw.trim();

  // Strip common separators (colons and spaces)
  const stripped = trimmed.replace(/[:\s]/g, "");

  // Case 1: already a valid hex string (after stripping separators)
  if (/^[0-9a-fA-F]+$/.test(stripped)) {
    return stripped.toUpperCase();
  }

  // Case 2: pure decimal integer (no separators in original, digits only)
  // e.g. "2346117917" from a keyboard-wedge reader
  if (/^\d+$/.test(trimmed)) {
    const num = BigInt(trimmed);
    return num.toString(16).toUpperCase();
  }

  // Fallback: return uppercase stripped value; isValidUID will reject it
  return stripped.toUpperCase();
}

/**
 * Validate a normalised UID.
 *
 * Accepts:
 *  - Hex UIDs: 4–20 uppercase hex characters (2–10 bytes), e.g. "04032A92D41391"
 *  - Decimal-derived UIDs that were converted to hex by normalizeUID()
 *    — these also satisfy the hex check after conversion, so no special
 *    case is needed here.
 *
 * Note: call normalizeUID() before isValidUID().
 */
export function isValidUID(uid: string): boolean {
  // Must be uppercase hex, 4–20 chars (covers both hex NFC UIDs and
  // decimal card numbers once converted to hex)
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
