import { z } from "zod";

export const accountSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(80, "الاسم طويل جدًا"),
  avatarUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export type AccountInput = z.input<typeof accountSchema>;
