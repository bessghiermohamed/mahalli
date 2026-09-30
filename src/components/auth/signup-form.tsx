"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signupAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleButton } from "@/components/auth/login-form";

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    const result = await signupAction(values);
    if (!result) return; // redirected to onboarding
    if ("needsConfirmation" in result && result.needsConfirmation) {
      setNeedsConfirmation(values.email);
      return;
    }
    if ("error" in result && result.error) setServerError(result.error);
  }

  if (needsConfirmation) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <MailCheck className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h2 className="mt-3 font-bold">فعّل بريدك الإلكتروني</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          أرسلنا رابط التأكيد إلى <span dir="ltr" className="font-medium">{needsConfirmation}</span>.
          افتح الرابط ثم ستُنقل مباشرة لإنشاء متجرك.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          لم يصلك الرابط؟ تحقق من مجلد البريد المزعج (Spam).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">الاسم الكامل</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="مثال: أمين بلقاسم"
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
        {errors.fullName ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          dir="ltr"
          className="text-start"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="8 أحرف على الأقل مع رقم واحد"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {serverError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        إنشاء الحساب
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2 text-xs text-muted-foreground">أو</span>
        </div>
      </div>

      <GoogleButton next="/onboarding" />

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        بإنشاء الحساب أنت توافق على استخدام المنصة لعرض منتجاتك واستقبال طلبات
        الدفع عند الاستلام.
      </p>
    </form>
  );
}
