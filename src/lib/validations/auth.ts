import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("بريد إلكتروني غير صحيح").max(254),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(72),
});

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(80, "الاسم طويل جدًا"),
  email: z.email("بريد إلكتروني غير صحيح").max(254),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .max(72, "كلمة المرور طويلة جدًا")
    .regex(/[a-zA-Z]/, "يجب أن تحتوي كلمة المرور على حرف واحد على الأقل")
    .regex(/\d/, "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("بريد إلكتروني غير صحيح").max(254),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .max(72, "كلمة المرور طويلة جدًا")
      .regex(/[a-zA-Z]/, "يجب أن تحتوي كلمة المرور على حرف واحد على الأقل")
      .regex(/\d/, "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
