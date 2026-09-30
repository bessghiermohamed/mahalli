import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  checkOrderRateLimit,
  clientIp,
  resetRateLimitForTests,
} from "@/lib/rate-limit";

describe("checkOrderRateLimit", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("allows the first requests and returns remaining count", () => {
    const r1 = checkOrderRateLimit("1.1.1.1", "shop-a");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBeGreaterThan(0);
  });

  it("blocks after the per-store limit is exceeded", () => {
    for (let i = 0; i < 5; i++) {
      const r = checkOrderRateLimit("2.2.2.2", "shop-a");
      expect(r.allowed).toBe(true);
    }
    const blocked = checkOrderRateLimit("2.2.2.2", "shop-a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks limits per (ip, store) pair independently", () => {
    for (let i = 0; i < 5; i++) {
      checkOrderRateLimit("3.3.3.3", "shop-a");
    }
    expect(checkOrderRateLimit("3.3.3.3", "shop-a").allowed).toBe(false);
    expect(checkOrderRateLimit("3.3.3.3", "shop-b").allowed).toBe(true);
    expect(checkOrderRateLimit("4.4.4.4", "shop-a").allowed).toBe(true);
  });

  it("blocks across stores when the global IP limit is hit", () => {
    // 30 global requests: 3 per store across 10 stores (below the
    // per-store limit of 5 so only the global counter kicks in)
    const stores = Array.from({ length: 10 }, (_, i) => `s${i}`);
    for (let round = 0; round < 3; round++) {
      for (const s of stores) {
        expect(checkOrderRateLimit("5.5.5.5", s).allowed).toBe(true);
      }
    }
    const r = checkOrderRateLimit("5.5.5.5", "s11");
    expect(r.allowed).toBe(false);
  });
});

describe("clientIp", () => {
  it("reads x-forwarded-for first", () => {
    const headers = new Headers({
      "x-forwarded-for": "9.9.9.9, 10.0.0.1",
      "x-real-ip": "8.8.8.8",
    });
    expect(clientIp(headers)).toBe("9.9.9.9");
  });

  it("falls back to x-real-ip then unknown", () => {
    expect(clientIp(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

afterEach(() => {
  resetRateLimitForTests();
});
