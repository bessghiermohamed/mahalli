import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SITE_URL } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert PostgREST numeric strings to numbers safely. */
export function num(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Convert nullable numeric strings to nullable numbers. */
export function numOrNull(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Format a DZD amount: Arabic UI → "1,500 دج", French UI → "1 500 DA".
 * Western digits are the norm for prices in Algeria.
 */
export function formatDZD(amount: number, locale: "ar" | "fr" = "ar"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (locale === "fr") {
    const formatted = new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 2,
    })
      .format(safe)
      // Normalize Unicode narrow/no-break spaces to a plain space for
      // consistent rendering and testability.
      .replace(/[\u202F\u00A0]/g, " ");
    return `${formatted} DA`;
  }
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(safe)} دج`;
}

const ALGIERS_TZ = "Africa/Algiers";

export function formatDate(
  iso: string,
  locale: "ar" | "fr" = "ar",
  withTime = true
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: ALGIERS_TZ,
    numberingSystem: "latn",
  }).format(d);
}

/** First day of the current month in Algiers local time (for client-side stats). */
export function monthStartAlgiers(): Date {
  const now = new Date();
  const algiersNow = new Date(
    now.toLocaleString("en-US", { timeZone: ALGIERS_TZ })
  );
  return new Date(algiersNow.getFullYear(), algiersNow.getMonth(), 1);
}

/** Absolute URL for a store path. */
export function storeUrl(slug: string, path = ""): string {
  const base = SITE_URL.replace(/\/$/, "");
  return `${base}/${slug}${path ? `/${path.replace(/^\//, "")}` : ""}`;
}

/** Clamp helper */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
