/**
 * Algerian phone number validation & normalization.
 *
 * Accepted input shapes:
 *  - 0550123456            (mobile with leading 0)
 *  - 550123456             (mobile without leading 0)
 *  - +213550123456 / 213550123456
 *  - 0212345678            (landline, e.g. Algiers 021)
 *  - +213212345678 / 213212345678
 * Spaces, dashes, dots and parentheses are ignored.
 *
 * Stored format (E.164 without "+"): mobile 21355xxxxxx (12 digits),
 * landline 21321xxxxxxx (12 digits).
 */

const MOBILE_WITH_ZERO = /^0([567]\d{8})$/;
const MOBILE_NO_ZERO = /^([567]\d{8})$/;
const MOBILE_INTL = /^213([567]\d{8})$/;
const LANDLINE_WITH_ZERO = /^0([234]\d{8})$/;
const LANDLINE_INTL = /^213([234]\d{8})$/;

export function normalizeAlgerianPhone(input: string): string | null {
  if (!input) return null;
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;

  const mobile =
    MOBILE_WITH_ZERO.exec(digits) ||
    MOBILE_NO_ZERO.exec(digits) ||
    MOBILE_INTL.exec(digits);
  if (mobile) return `213${mobile[1]}`;

  const landline = LANDLINE_WITH_ZERO.exec(digits) || LANDLINE_INTL.exec(digits);
  if (landline) return `213${landline[1]}`;

  return null;
}

/** wa.me expects the international format without "+" */
export function waNumber(e164: string): string {
  return e164.replace(/^\+/, "");
}

/** "213550123456" → "0550123456", "213212345678" → "0212345678" */
export function formatPhoneLocal(e164: string): string {
  const clean = waNumber(e164);
  if (clean.startsWith("213")) {
    const rest = clean.slice(3);
    if (/^[567]\d{8}$/.test(rest)) return `0${rest}`;
    if (/^[234]\d{8}$/.test(rest)) return `0${rest}`;
  }
  return clean;
}

/** "213550123456" → "+213 550 12 34 56" for readable display */
export function formatPhoneIntl(e164: string): string {
  const clean = waNumber(e164);
  if (/^213\d{9}$/.test(clean)) {
    return `+213 ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)} ${clean.slice(10)}`;
  }
  return `+${clean}`;
}
