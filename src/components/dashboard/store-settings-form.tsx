"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { storeSchema, type StoreInput } from "@/lib/validations/store";
import { updateStoreAction } from "@/app/actions/dashboard";
import { BUCKETS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StoreSettingsForm({
  initial,
}: {
  initial: {
    name: string;
    slug: string;
    bio: string;
    whatsapp: string;
    instagram: string;
    facebook: string;
    logoUrl: string;
  };
}) {
  const router = useRouter();
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logoUrl || null);
  const [logoChanged, setLogoChanged] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: initial.name,
      slug: initial.slug,
      bio: initial.bio,
      whatsapp: initial.whatsapp,
      instagram: initial.instagram,
      facebook: initial.facebook,
      logoUrl: initial.logoUrl,
    },
  });

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جدًا (الحد 8 ميغابايت)");
      return;
    }
    setLogoChanged(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: StoreInput) {
    setServerError(null);

    let logoUrl = values.logoUrl || "";
    if (logoChanged) {
      try {
        setUploading(true);
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) {
          setServerError("انتهت الجلسة، سجّل الدخول من جديد");
          return;
        }
        const compressed = await compressImage(logoChanged, 512, 0.85);
        const path = `${uid}/logo-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKETS.logos)
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (uploadError) {
          setServerError("تعذّر رفع الشعار، حاول مرة أخرى");
          return;
        }
        const { data: pub } = supabase.storage.from(BUCKETS.logos).getPublicUrl(path);
        logoUrl = pub.publicUrl;
      } finally {
        setUploading(false);
      }
    }

    startTransition(async () => {
      const result = await updateStoreAction({ ...values, logoUrl });
      if (result && "error" in result && result.error) {
        setServerError(result.error);
        return;
      }
      toast.success("تم حفظ إعدادات المتجر");
      router.refresh();
    });
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">هوية المتجر</CardTitle>
          <CardDescription>الاسم والشعار والنبذة الظاهرة في صفحة متجرك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="شعار المتجر"
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={logoPreview.startsWith("blob:")}
                />
              ) : (
                <ImageUp className="size-7 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="text-sm font-medium text-primary hover:underline"
              >
                تغيير الشعار
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={onLogoChange}
                aria-label="اختيار شعار المتجر"
              />
              <p className="text-xs text-muted-foreground">PNG أو JPG، ويفضل مربع الشكل</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">اسم المتجر</Label>
            <Input
              id="name"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-xs text-destructive" role="alert">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">رابط المتجر</Label>
            <div dir="ltr" className="flex items-center rounded-md border">
              <span className="select-none border-e bg-muted px-3 py-2 text-sm text-muted-foreground">
                mahalli.app/
              </span>
              <Input
                id="slug"
                className="rounded-none border-0 focus-visible:ring-0"
                aria-invalid={!!errors.slug}
                {...register("slug")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              تحذير: تغيير الرابط يغير عنوان متجرك القديم، ومتابعوك قد لا يجدونه. عدّله فقط
              إذا كان ضروريًا.
            </p>
            {errors.slug ? (
              <p className="text-xs text-destructive" role="alert">{errors.slug.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">نبذة عن المتجر</Label>
            <Textarea id="bio" rows={3} aria-invalid={!!errors.bio} {...register("bio")} />
            {errors.bio ? (
              <p className="text-xs text-destructive" role="alert">{errors.bio.message}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">التواصل</CardTitle>
          <CardDescription>رقم واتساب وحسابات التواصل الاجتماعي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">رقم واتساب</Label>
            <Input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              dir="ltr"
              className="w-full text-start sm:w-56"
              aria-invalid={!!errors.whatsapp}
              {...register("whatsapp")}
            />
            {errors.whatsapp ? (
              <p className="text-xs text-destructive" role="alert">{errors.whatsapp.message}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instagram">إنستغرام (اختياري)</Label>
              <Input id="instagram" dir="ltr" className="text-start" {...register("instagram")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">فيسبوك (اختياري)</Label>
              <Input id="facebook" dir="ltr" className="text-start" {...register("facebook")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {serverError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          حفظ التغييرات
        </Button>
      </div>
    </form>
  );
}
