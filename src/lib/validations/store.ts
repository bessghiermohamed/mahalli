import { z } from "zod";
import { isValidSlug, RESERVED_SLUGS, slugify, SLUG_PATTERN } from "@/lib/slug";
import { normalizeAlgerianPhone } from "@/lib/phone";

/** Social links accept a full URL or a @username / page name. */
function normalizeSocial(raw: string, host: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "").replace(/\/+$/, "");
  return `https://${host}/${handle}`;
}

export const storeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اسم المتجر يجب أن يكون حرفين على الأقل")
    .max(60, "اسم المتجر طويل جدًا"),
  slug: z
    .string()
    .trim()
    .min(2, "الرابط يجب أن يكون حرفين على الأقل")
    .max(40, "الرابط طويل جدًا")
    .transform((v) => slugify(v))
    .refine((v) => SLUG_PATTERN.test(v), {
      message: "الرابط يقبل الحروف والأرقام والشرطة فقط",
    })
    .refine((v) => !RESERVED_SLUGS.has(v), {
      message: "هذا الرابط محجوز، اختر رابطًا آخر",
    })
    .refine((v) => isValidSlug(v), { message: "رابط غير صالح" }),
  bio: z.string().trim().max(500, "النبذة طويلة جدًا (500 حرف كحد أقصى)").optional().or(z.literal("")),
  whatsapp: z
    .string()
    .trim()
    .refine((v) => normalizeAlgerianPhone(v) !== null, {
      message: "أدخل رقم واتساب جزائري صحيح (مثال: 0550123456)",
    })
    .transform((v) => normalizeAlgerianPhone(v) as string),
  instagram: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? normalizeSocial(v, "instagram.com") : "")),
  facebook: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? normalizeSocial(v, "facebook.com") : "")),
  logoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  defaultDeliveryFee: z.coerce
    .number({ message: "أدخل سعرًا صحيحًا" })
    .int("أدخل سعرًا صحيحًا بدون كسور")
    .min(0, "لا يمكن أن يكون سعر التوصيل سالبًا")
    .max(10000, "سعر التوصيل مرتفع جدًا")
    .optional()
    .nullable(),
});

export type StoreInput = z.input<typeof storeSchema>;
export type StoreParsed = z.output<typeof storeSchema>;

export const slugCheckSchema = z.object({
  slug: z.string().trim().min(1).max(40),
});
