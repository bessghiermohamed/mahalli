"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";

export interface ActionError {
  error: string;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  email_not_confirmed:
    "لم يتم تأكيد البريد الإلكتروني بعد، تحقق من صندوق الوارد لديك",
  user_not_found: "لا يوجد حساب بهذا البريد الإلكتروني",
  over_request_rate_limit: "محاولات كثيرة، انتظر قليلًا ثم أعد المحاولة",
  user_banned: "تم تعطيل هذا الحساب، تواصل مع الدعم",
};

function authErrorMessage(message?: string): string {
  if (!message) return "حدث خطأ غير متوقع، حاول مرة أخرى";
  const key = message.toLowerCase().replace(/\s+/g, "_");
  return (
    AUTH_ERROR_MESSAGES[key] || "حدث خطأ غير متوقع، حاول مرة أخرى"
  );
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin") || h.get("x-forwarded-host");
  if (origin) {
    return origin.startsWith("http") ? origin : `https://${origin}`;
  }
  return SITE_URL;
}

function safeNext(next: string | undefined | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

export async function loginAction(values: unknown, next?: string) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "تحقق من البيانات المدخلة" } satisfies ActionError;
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error.message) } satisfies ActionError;

  redirect(safeNext(next));
}

export async function signupAction(values: unknown) {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "تحقق من البيانات المدخلة" } satisfies ActionError;
  }
  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) return { error: authErrorMessage(error.message) } satisfies ActionError;

  // If email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return { needsConfirmation: true } as const;
  }

  redirect("/onboarding");
}

export async function googleAction(next?: string) {
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    return {
      error: "تعذّر بدء تسجيل الدخول بحساب Google، حاول مرة أخرى",
    } satisfies ActionError;
  }
  redirect(data.url);
}

export async function forgotPasswordAction(values: unknown) {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "أدخل بريدًا إلكترونيًا صحيحًا" } satisfies ActionError;
  }
  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  if (error) return { error: authErrorMessage(error.message) } satisfies ActionError;
  return { sent: true } as const;
}

export async function resetPasswordAction(values: unknown) {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "تحقق من كلمة المرور",
    } satisfies ActionError;
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: authErrorMessage(error.message) } satisfies ActionError;
  }

  // Fresh session with the new credentials — sign out and let the user log in.
  await supabase.auth.signOut();
  redirect("/login?reset=1");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
