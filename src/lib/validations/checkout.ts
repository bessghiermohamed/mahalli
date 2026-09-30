import { z } from "zod";
import { normalizeAlgerianPhone } from "@/lib/phone";
import { MAX_CART_ITEMS, MAX_QUANTITY } from "@/lib/constants";

/**
 * Checkout payload. Prices, delivery fee, totals, store and product
 * ownership are ALL resolved server-side — the client only sends
 * product IDs and quantities.
 */
export const checkoutSchema = z.object({
  storeSlug: z.string().trim().min(1).max(60),
  items: z
    .array(
      z.object({
        productId: z.uuid("منتج غير صالح"),
        quantity: z.coerce
          .number()
          .int("كمية غير صالحة")
          .min(1, "الكمية يجب أن تكون 1 على الأقل")
          .max(MAX_QUANTITY, `الكمية القصوى ${MAX_QUANTITY}`),
      })
    )
    .min(1, "السلة فارغة")
    .max(MAX_CART_ITEMS, "عدد المنتجات في السلة كبير جدًا"),
  customerName: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(80, "الاسم طويل جدًا"),
  customerPhone: z
    .string()
    .trim()
    .refine((v) => normalizeAlgerianPhone(v) !== null, {
      message: "أدخل رقم هاتف جزائري صحيح (مثال: 0550123456)",
    })
    .transform((v) => normalizeAlgerianPhone(v) as string),
  wilayaCode: z.coerce.number().int().min(1, "اختر الولاية").max(58, "اختر الولاية"),
  commune: z
    .string()
    .trim()
    .min(2, "أدخل اسم البلدية")
    .max(80, "اسم البلدية طويل جدًا"),
  address: z
    .string()
    .trim()
    .min(5, "أدخل عنوانًا أوضح (الحي، الشارع، نقطة مرجعية)")
    .max(200, "العنوان طويل جدًا"),
  notes: z.string().trim().max(500, "الملاحظات طويلة جدًا").optional().or(z.literal("")),
  clientRequestId: z.uuid("طلب غير صالح"),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutParsed = z.output<typeof checkoutSchema>;
/** Strip control characters before persisting free-text fields. */
export function sanitizeText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}
