import { describe, expect, it } from "vitest";
import { formatDZD, num, numOrNull } from "@/lib/utils";
import { resolveDeliveryFee } from "@/lib/delivery";
import { buildOrderMessageAr, waLink } from "@/lib/whatsapp";
import type { PublicOrderResult } from "@/types/database";

describe("num / numOrNull (PostgREST numeric strings)", () => {
  it("converts numeric strings", () => {
    expect(num("4500.00")).toBe(4500);
    expect(num("12.5")).toBe(12.5);
    expect(num(7)).toBe(7);
    expect(num(null)).toBe(0);
    expect(num("abc")).toBe(0);
  });

  it("keeps null semantics", () => {
    expect(numOrNull(null)).toBeNull();
    expect(numOrNull("")).toBeNull();
    expect(numOrNull("3")).toBe(3);
  });
});

describe("formatDZD", () => {
  it("formats Arabic UI with دج suffix and western digits", () => {
    expect(formatDZD(1500)).toBe("1,500 دج");
    expect(formatDZD(0)).toBe("0 دج");
  });

  it("formats French UI with DA suffix", () => {
    expect(formatDZD(1500, "fr")).toBe("1 500 DA");
  });
});

describe("resolveDeliveryFee", () => {
  it("prefers the store per-wilaya override", () => {
    expect(
      resolveDeliveryFee({ overrideFee: 400, storeDefaultFee: 600, wilayaDefaultFee: 800 })
    ).toBe(400);
  });

  it("falls back to the store default fee", () => {
    expect(
      resolveDeliveryFee({ overrideFee: null, storeDefaultFee: 600, wilayaDefaultFee: 800 })
    ).toBe(600);
  });

  it("falls back to the wilaya default fee", () => {
    expect(
      resolveDeliveryFee({ overrideFee: null, storeDefaultFee: null, wilayaDefaultFee: 800 })
    ).toBe(800);
  });

  it("allows free delivery and defaults to zero", () => {
    expect(
      resolveDeliveryFee({ overrideFee: 0, storeDefaultFee: 600, wilayaDefaultFee: 800 })
    ).toBe(0);
    expect(
      resolveDeliveryFee({ overrideFee: null, storeDefaultFee: null, wilayaDefaultFee: null })
    ).toBe(0);
  });
});

describe("buildOrderMessageAr", () => {
  const order = {
    order_number: "MH-260101-ABC12",
    customer_name: "محمد أمين",
    customer_phone: "213550123456",
    commune: "باب الزوار",
    address: "حي 5 جويلية، عمارة ب",
    notes: "اتصل قبل الوصول",
    wilaya_name_ar: "الجزائر",
    items: [
      { name: "باقة ورد", quantity: 2, subtotal: 9000 },
      { name: "شمعة", quantity: 1, subtotal: 1800 },
    ],
    subtotal: 10800,
    delivery_fee: 400,
    total: 11200,
  };

  it("includes all required order details in Arabic", () => {
    const msg = buildOrderMessageAr(order, "متجر الزهور");
    expect(msg).toContain("MH-260101-ABC12");
    expect(msg).toContain("محمد أمين");
    expect(msg).toContain("باقة ورد × 2 = 9,000 دج");
    expect(msg).toContain("شمعة × 1 = 1,800 دج");
    expect(msg).toContain("11,200 دج");
    expect(msg).toContain("ولاية الجزائر");
    expect(msg).toContain("باب الزوار");
    expect(msg).toContain("اتصل قبل الوصول");
    expect(msg).toContain("Mahalli");
  });
});

describe("waLink", () => {
  it("builds a wa.me URL with encoded Arabic text", () => {
    const url = waLink("213550123456", "طلب جديد من Mahalli");
    expect(url.startsWith("https://wa.me/213550123456?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("طلب جديد من Mahalli");
  });
});
