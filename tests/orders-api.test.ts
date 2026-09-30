import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Order API integration tests with a mocked Supabase server client.
 * Verifies: validation errors, rate limiting, RPC error mapping and the
 * success path (prices are always returned from the RPC, never the client).
 */

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: rpcMock,
  }),
}));

import { POST } from "@/app/api/orders/route";
import { resetRateLimitForTests } from "@/lib/rate-limit";

const UUID = "11111111-1111-4111-8111-111111111111";

function validBody() {
  return {
    storeSlug: "flower-shop",
    items: [{ productId: UUID, quantity: 2 }],
    customerName: "محمد أمين",
    customerPhone: "0550123456",
    wilayaCode: 16,
    commune: "باب الزوار",
    address: "حي 5 جويلية عمارة ب",
    notes: "",
    clientRequestId: UUID,
  };
}

function makeRequest(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  }) as never;
}

const RPC_ORDER = {
  order_number: "MH-260101-TEST1",
  customer_name: "محمد أمين",
  customer_phone: "213550123456",
  commune: "باب الزوار",
  address: "حي 5 جويلية عمارة ب",
  notes: null,
  subtotal: 9000,
  delivery_fee: 400,
  total: 9400,
  status: "new",
  created_at: "2026-01-01T10:00:00Z",
  wilaya: { code: 16, name_ar: "الجزائر", name_fr: "Alger" },
  items: [{ name: "باقة ورد", unit_price: 4500, quantity: 2, subtotal: 9000 }],
};

beforeEach(() => {
  rpcMock.mockReset();
  rpcMock.mockResolvedValue({ data: { duplicate: false, order: RPC_ORDER }, error: null });
  resetRateLimitForTests();
});

describe("POST /api/orders", () => {
  it("creates an order and returns server-computed totals", async () => {
    const res = await POST(makeRequest(validBody()));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.order.total).toBe(9400); // 9000 + 400 from the RPC
    expect(json.order.order_number).toBe("MH-260101-TEST1");

    // Verify the RPC received normalized + sanitized values
    const call = rpcMock.mock.calls[0][1];
    expect(call.p_customer_phone).toBe("213550123456");
    expect(call.p_store_slug).toBe("flower-shop");
    expect(call.p_items).toEqual([{ product_id: UUID, quantity: 2 }]);
    expect(call.p_client_request_id).toBe(UUID);
  });

  it("returns 400 with a message for invalid payloads", async () => {
    const body = { ...validBody(), customerPhone: "123" };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("maps OUT_OF_STOCK to 409", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "OUT_OF_STOCK:باقة ورد" },
    });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe("OUT_OF_STOCK");
  });

  it("maps INVALID_PRODUCTS (cross-store product ids) to 400", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "INVALID_PRODUCTS" },
    });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("INVALID_PRODUCTS");
  });

  it("maps STORE_NOT_FOUND to 400", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "STORE_NOT_FOUND" },
    });

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("STORE_NOT_FOUND");
  });

  it("returns 429 when rate limited and never calls the RPC", async () => {
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest(validBody(), "9.9.9.9"));
    }
    const callsBefore = rpcMock.mock.calls.length;

    const res = await POST(makeRequest(validBody(), "9.9.9.9"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(rpcMock.mock.calls.length).toBe(callsBefore);
  });

  it("returns the existing order for duplicate clientRequestIds", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { duplicate: true, order: RPC_ORDER },
      error: null,
    });

    const res = await POST(makeRequest(validBody()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.duplicate).toBe(true);
    expect(json.order.order_number).toBe(RPC_ORDER.order_number);
  });

  it("returns 400 for malformed JSON bodies", async () => {
    const req = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "1.1.1.1" },
      body: "not json",
    }) as never;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
