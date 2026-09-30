import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema, sanitizeText } from "@/lib/validations/checkout";
import { checkOrderRateLimit, clientIp } from "@/lib/rate-limit";
import type { PublicOrderResult } from "@/types/database";

export const dynamic = "force-dynamic";

interface RpcResult {
  duplicate: boolean;
  order: PublicOrderResult;
}

/**
 * POST /api/orders — COD order creation.
 *
 * Security layers:
 *  1. Rate limiting (per IP+store, per IP)
 *  2. Zod schema validation + input sanitization
 *  3. Phone normalization (E.164)
 *  4. Server-side price/fee/total calculation inside the create_order RPC
 *     (product activity, store ownership, stock and delivery fee are all
 *     re-validated in the database — the client never supplies prices)
 *  5. Idempotency via clientRequestId (unique per store)
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "طلب غير صالح" },
      { status: 400 }
    );
  }

  // Basic shape check to extract the store slug for rate limiting
  const storeSlug =
    typeof body === "object" && body !== null && "storeSlug" in body
      ? String((body as Record<string, unknown>).storeSlug).slice(0, 60)
      : "";

  const ip = clientIp(request.headers);
  const limit = checkOrderRateLimit(ip, storeSlug || "unknown");
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "عدد كبير من المحاولات، حاول بعد قليل", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message || "تحقق من البيانات المدخلة", code: "VALIDATION" },
      { status: 400 }
    );
  }

  const d = parsed.data;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_order", {
    p_store_slug: d.storeSlug,
    p_items: d.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    p_customer_name: sanitizeText(d.customerName),
    p_customer_phone: d.customerPhone,
    p_wilaya_code: d.wilayaCode,
    p_commune: sanitizeText(d.commune),
    p_address: sanitizeText(d.address),
    p_notes: d.notes ? sanitizeText(d.notes) : null,
    p_client_request_id: d.clientRequestId,
  });

  if (error) {
    const message = error.message || "";
    // Structured errors raised by the RPC (e.g. "OUT_OF_STOCK:اسم المنتج")
    const [code, detail] = message.split(":");
    const knownCodes = new Set([
      "STORE_NOT_FOUND",
      "WILAYA_NOT_FOUND",
      "EMPTY_CART",
      "TOO_MANY_ITEMS",
      "INVALID_QUANTITY",
      "INVALID_PRODUCTS",
      "PRODUCT_INACTIVE",
      "OUT_OF_STOCK",
      "INVALID_PRICE",
      "INVALID_CUSTOMER",
      "INVALID_PHONE",
      "INVALID_COMMUNE",
      "INVALID_ADDRESS",
      "ORDER_NUMBER_COLLISION",
    ]);

    if (code === "OUT_OF_STOCK" || code === "PRODUCT_INACTIVE") {
      return NextResponse.json(
        { error: "الكمية المطلوبة غير متوفرة حاليًا", code, product: detail },
        { status: 409 }
      );
    }
    if (knownCodes.has(code)) {
      return NextResponse.json({ error: "تعذّر إنشاء الطلب", code }, { status: 400 });
    }

    console.error("[orders] RPC error:", message);
    return NextResponse.json(
      { error: "تعذّر إنشاء الطلب، حاول مرة أخرى" },
      { status: 500 }
    );
  }

  const result = (data as unknown as RpcResult) || null;
  if (!result || !result.order) {
    return NextResponse.json(
      { error: "تعذّر إنشاء الطلب، حاول مرة أخرى" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, duplicate: result.duplicate, order: result.order },
    { status: result.duplicate ? 200 : 201 }
  );
}
