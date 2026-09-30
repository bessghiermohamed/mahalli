// Mahalli shared constants

export const SITE_NAME = "Mahalli";
export const SITE_NAME_AR = "محلي";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mahalli.app";

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const ORDER_STATUS_LABELS_AR: Record<string, string> = {
  new: "جديد",
  confirmed: "مؤكد",
  shipped: "قيد التوصيل",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};

export const ORDER_STATUS_BADGE_CLASS: Record<string, string> = {
  new: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  shipped: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  delivered:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export const BUCKETS = {
  logos: "store-logos",
  productImages: "product-images",
  avatars: "avatars",
} as const;

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_CART_ITEMS = 50;
export const MAX_QUANTITY = 99;

// Anti-abuse: fixed-window limits (per server instance)
export const ORDER_RATE_LIMIT = 5; // order requests
export const ORDER_RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes per IP+store
export const ORDER_IP_RATE_LIMIT = 30; // per 10 minutes per IP across stores
