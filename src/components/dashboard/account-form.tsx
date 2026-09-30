"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { accountSchema, type AccountInput } from "@/lib/validations/account";
import { updateAccountAction } from "@/app/actions/dashboard";
import { logoutAction } from "@/app/actions/auth";
import { BUCKETS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountForm({
  initial,
  email,
}: {
  initial: { fullName: string; avatarUrl: string };
  email: string;
}) {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initial.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: { fullName: initial.fullName, avatarUrl: initial.avatarUrl },
  });

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جدًا (الحد 8 ميغابايت)");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: AccountInput) {
    setServerError(null);

    let avatarUrl = values.avatarUrl || "";
    if (avatarFile) {
      try {
        setUploading(true);
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) {
          setServerError("انتهت الجلسة، سجّل الدخول من جديد");
          return;
        }
        const compressed = await compressImage(avatarFile, 512, 0.85);
        const path = `${uid}/avatar-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKETS.avatars)
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (uploadError) {
          setServerError("تعذّر رفع الصورة، حاول مرة أخرى");
          return;
        }
        const { data: pub } = supabase.storage.from(BUCKETS.avatars).getPublicUrl(path);
        avatarUrl = pub.publicUrl;
      } finally {
        setUploading(false);
      }
    }

    startTransition(async () => {
      const result = await updateAccountAction({ ...values, avatarUrl });
      if (result && "error" in result && result.error) {
        setServerError(result.error);
        return;
      }
      toast.success("تم حفظ بيانات حسابك");
      router.refresh();
    });
  }

  const busy = isPending || uploading;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات الحساب</CardTitle>
          <CardDescription>
            بريدك الإلكتروني: <span dir="ltr" className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="flex items-center gap-4">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="صورة الحساب"
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={avatarPreview.startsWith("blob:")}
                  />
                ) : (
                  <span className="text-xl font-bold text-muted-foreground">
                    {(initial.fullName || "؟").trim().charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  تغيير الصورة
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={onAvatarChange}
                  aria-label="اختيار صورة الحساب"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
              />
              {errors.fullName ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.fullName.message}
                </p>
              ) : null}
            </div>

            {serverError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {serverError}
              </p>
            ) : null}

            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              حفظ
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الجلسة</CardTitle>
          <CardDescription>إنهاء جلستك على هذا الجهاز</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" aria-hidden="true" />
              تسجيل الخروج
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
