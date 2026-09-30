import { describe, expect, it } from "vitest";
import { checkoutSchema, sanitizeText } from "@/lib/validations/checkout";
import { storeSchema } from "@/lib/validations/store";
import { productSchema } from "@/lib/validations/product";

const UUID = "11111111-1111-4111-8111-111111111111";

function validCheckout() {
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

describe("checkoutSchema", () => {
  it("accepts a valid payload and normalizes the phone", () => {
    const result = checkoutSchema.safeParse(validCheckout());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerPhone).toBe("213550123456");
      expect(result.data.items[0].quantity).toBe(2);
    }
  });

  it("rejects an empty cart", () => {
    const payload = { ...validCheckout(), items: [] };
    expect(checkoutSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects zero or negative quantities", () => {
    const payload = { ...validCheckout(), items: [{ productId: UUID, quantity: 0 }] };
    expect(checkoutSchema.safeParse(payload).success).toBe(false);
    const payload2 = { ...validCheckout(), items: [{ productId: UUID, quantity: -3 }] };
    expect(checkoutSchema.safeParse(payload2).success).toBe(false);
  });

  it("rejects quantities above the cap", () => {
    const payload = { ...validCheckout(), items: [{ productId: UUID, quantity: 500 }] };
    expect(checkoutSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects invalid phone numbers", () => {
    const payload = { ...validCheckout(), customerPhone: "12345" };
    expect(checkoutSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects unknown wilaya codes", () => {
    const payload = { ...validCheckout(), wilayaCode: 59 };
    expect(checkoutSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects short addresses", () => {
    const payload = { ...validCheckout(), address: "abc" };
    expect(checkoutSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects a non-uuid clientRequestId", () => {
    const payload = { ...validCheckout(), clientRequestId: "not-a-uuid" };
    expect(checkoutSchema.safeParse(payload).success).toBe(false);
  });
});

describe("sanitizeText", () => {
  it("strips control characters and trims", () => {
    expect(sanitizeText("  hello\u0000 world \u001F")).toBe("hello world");
  });
});

describe("storeSchema", () => {
  it("normalizes whatsapp to E.164 and accepts Arabic slugs", () => {
    const result = storeSchema.safeParse({
      name: "متجر الزهور",
      slug: "متجر-الزهور",
      whatsapp: "0550 12 34 56",
      defaultDeliveryFee: 500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.whatsapp).toBe("213550123456");
      expect(result.data.slug).toBe("متجر-الزهور");
    }
  });

  it("rejects reserved slugs like dashboard", () => {
    const result = storeSchema.safeParse({
      name: "Test",
      slug: "dashboard",
      whatsapp: "0550123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative delivery fee", () => {
    const result = storeSchema.safeParse({
      name: "Test",
      slug: "test-shop",
      whatsapp: "0550123456",
      defaultDeliveryFee: -5,
    });
    expect(result.success).toBe(false);
  });

  it("builds social URLs from handles", () => {
    const result = storeSchema.safeParse({
      name: "Test",
      slug: "test-shop",
      whatsapp: "0550123456",
      instagram: "@my.shop",
      facebook: "https://facebook.com/mypage",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instagram).toBe("https://instagram.com/my.shop");
      expect(result.data.facebook).toBe("https://facebook.com/mypage");
    }
  });
});

describe("productSchema", () => {
  it("accepts a valid product and leaves stock untracked when empty", () => {
    const result = productSchema.safeParse({
      name: "باقة ورد",
      price: 4500,
      active: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(4500);
      expect(result.data.stock ?? null).toBeNull();
    }
  });

  it("rejects negative prices and negative stock", () => {
    expect(
      productSchema.safeParse({ name: "p", price: -100 }).success
    ).toBe(false);
    expect(
      productSchema.safeParse({ name: "p", price: 100, stock: -1 }).success
    ).toBe(false);
  });

  it("rejects fractional prices", () => {
    expect(
      productSchema.safeParse({ name: "p", price: 99.5 }).success
    ).toBe(false);
  });
});
