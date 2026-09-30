/**
 * Slug utilities — Arabic or Latin letters, digits and hyphens.
 * Used for store slugs (/flower-shop) and product URLs (/flower-shop/p/...).
 */

export const SLUG_PATTERN =
  /^(?!-)[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*(?<!-)$/;

export const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "login",
  "signin",
  "signup",
  "register",
  "logout",
  "forgot-password",
  "reset-password",
  "dashboard",
  "onboarding",
  "settings",
  "account",
  "admin",
  "cart",
  "checkout",
  "orders",
  "order",
  "products",
  "product",
  "p",
  "delivery",
  "statistics",
  "share",
  "unauthorized",
  "new",
  "edit",
  "mahalli",
  "demo",
  "assets",
  "static",
  "public",
  "images",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "manifest.json",
  "_next",
  "_vercel",
]);

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\da-z\u0600-\u06FF-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

/** Deterministic suffix for uniqueness conflicts */
export function withSuffix(slug: string, suffix: string): string {
  const base = slug.slice(0, 40 - suffix.length - 1);
  return `${base}-${suffix}`;
}
