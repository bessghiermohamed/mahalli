import { z } from "zod";
import { isValidSlug, SLUG_PATTERN, slugify } from "@/lib/slug";

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اسم المنتج يجب أن يكون حرفين على الأقل")
    .max(100, "اسم المنتج طويل جدًا"),
  slug: z
    .string()
    .trim()
    .max(60)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? slugify(v) : ""))
    .refine((v) => v === "" || SLUG_PATTERN.test(v), {
      message: "رابط المنتج غير صالح",
    }),
  description: z
    .string()
    .trim()
    .max(5000, "الوصف طويل جدًا (5000 حرف كحد أقصى)")
    .optional()
    .or(z.literal("")),
  price: z.coerce
    .number({ message: "أدخل سعرًا صحيحًا" })
    .min(1, "السعر يجب أن يكون أكبر من صفر")
    .max(10000000, "السعر مرتفع جدًا")
    .refine((v) => Number.isInteger(v), "أدخل السعر بالدينار بدون كسور"),
  stock: z.coerce
    .number({ message: "أدخل كمية صحيحة" })
    .int("أدخل كمية صحيحة")
    .min(0, "لا يمكن أن تكون الكمية سالبة")
    .max(999999, "الكمية كبيرة جدًا")
    .optional()
    .nullable(),
  active: z.boolean().default(true),
});

export type ProductFormInput = z.input<typeof productSchema>;
export type ProductParsed = z.output<typeof productSchema>;

export interface ProductImageInput {
  storage_path: string;
  public_url: string;
  sort_order: number;
}

export const productImagesSchema = z
  .array(
    z.object({
      storage_path: z.string().min(1),
      public_url: z.string().min(1),
      sort_order: z.number().int().min(0),
    })
  )
  .max(8, "الحد الأقصى 8 صور للمنتج");
