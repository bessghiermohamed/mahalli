import { ORDER_IP_RATE_LIMIT, ORDER_RATE_LIMIT, ORDER_RATE_WINDOW_MS } from "@/lib/constants";

/**
 * Simple fixed-window in-memory rate limiter for order creation.
 *
 * Suitable for a single server instance (the MVP). When scaling to multiple
 * instances, swap the Map for Upstash Redis or a Postgres-backed counter —
 * the call signature stays the same.
 */

interface Window {
  count: number;
  resetAt: number;
}

const globalStore = globalThis as unknown as {
  __mahalliRateLimit?: Map<string, Window>;
};

const store: Map<string, Window> =
  globalStore.__mahalliRateLimit ?? new Map<string, Window>();
globalStore.__mahalliRateLimit = store;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const win = store.get(key);

  if (!win || win.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, remaining: limit - 1 };
  }

  if (win.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((win.resetAt - now) / 1000),
      remaining: 0,
    };
  }

  win.count += 1;
  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: limit - win.count,
  };
}

/** Occasional cleanup to keep memory bounded. */
function sweep() {
  const now = Date.now();
  if (store.size > 5000) {
    for (const [key, win] of store) {
      if (win.resetAt <= now) store.delete(key);
    }
  }
}

export function checkOrderRateLimit(ip: string, storeSlug: string): RateLimitResult {
  sweep();
  const perStore = hit(`store:${ip}:${storeSlug}`, ORDER_RATE_LIMIT, ORDER_RATE_WINDOW_MS);
  if (!perStore.allowed) return perStore;
  return hit(`ip:${ip}`, ORDER_IP_RATE_LIMIT, ORDER_RATE_WINDOW_MS);
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}

/** Test helper: wipe all windows. */
export function resetRateLimitForTests(): void {
  store.clear();
}
