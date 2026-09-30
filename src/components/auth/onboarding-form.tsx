"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ImageUp, Loader2, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { storeSchema, type StoreInput } from "@/lib/validations/store";
import { BUCKETS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { createStoreAction } from "@/app/actions/onboarding";
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

const DEFAULT_FEES = [
  { value: 400, label: "400 دج" },
  { value: 500, label: "500 دج" },
  { value: 600, label: "600 دج" },
  { value: 800, label: "800 دج" },
];

export function OnboardingForm({ initialFullName }: { initialFullName?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: initialFullName ? `متجر ${initialFullName.split(" ")[0]}` : "",
      slug: "",
      bio: "",
      whatsapp: "",
      instagram: "",
      facebook: "",
      logoUrl: "",
      defaultDeliveryFee: 500,
    },
  });

  const nameValue = watch("name");

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جدًا (الحد 8 ميغابايت)");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: StoreInput) {
    setServerError(null);

    let logoUrl = "";
    if (logoFile) {
      try {
        setUploading(true);
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) {
          setServerError("انتهت الجلسة، سجّل الدخول من جديد");
          return;
        }
        const compressed = await compressImage(logoFile, 512, 0.85);
        const path = `${uid}/logo-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKETS.logos)
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (uploadError) {
          setServerError("تعذّر رفع الشعار، حاول مرة أخرى");
          return;
        }
        const { data: publicData } = supabase.storage.from(BUCKETS.logos).getPublicUrl(path);
        logoUrl = publicData.publicUrl;
      } finally {
        setUploading(false);
      }
    }

    startTransition(async () => {
      const result = await createStoreAction({ ...values, logoUrl });
      if (result && "error" in result && result.error) {
        setServerError(result.error);
        return;
      }
      toast.success("تم إنشاء متجرك بنجاح");
      router.push("/dashboard?welcome=1");
    });
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <StoreIcon className="size-5 text-primary" aria-hidden="true" />
            معلومات المتجر
          </CardTitle>
          <CardDescription>
            هذه المعلومات ستظهر للزبائن في أعلى صفحة متجرك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
              {logoPreview ? (
                <img src={logoPreview} alt="معاينة شعار المتجر" className="size-full object-cover" />
              ) : (
                <ImageUp className="size-7 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logo" className="cursor-pointer text-sm font-medium text-primary">
                اختيار شعار المتجر
              </Label>
              <input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={onLogoChange}
              />
              <p className="text-xs text-muted-foreground">
                اختياري — PNG أو JPG، ويفضل مربع الشكل. يمكنك إضافته لاحقًا من الإعدادات.
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">اسم المتجر</Label>
            <Input
              id="name"
              placeholder="مثال: متجر الزهور"
              aria-invalid={!!errors.name}
              {...register("name", {
                onBlur: () => {
                  // Auto-fill slug from name if the user hasn't touched it
                  const currentSlug = watch("slug");
                  if (!currentSlug && nameValue) {
                    setValue("slug", nameValue, { shouldValidate: false });
                  }
                },
              })}
            />
            {errors.name ? (
              <p className="text-xs text-destructive" role="alert">{errors.name.message}</p>
            ) : null}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">رابط المتجر</Label>
            <div dir="ltr" className="flex items-center rounded-md border">
              <span className="select-none border-e bg-muted px-3 py-2 text-sm text-muted-foreground">
                mahalli.app/
              </span>
              <Input
                id="slug"
                className="rounded-none border-0 focus-visible:ring-0"
                placeholder="flower-shop"
                aria-invalid={!!errors.slug}
                {...register("slug")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              حروف إنجليزية صغيرة أو عربية وأرقام فقط. مثال: flower-shop
            </p>
            {errors.slug ? (
              <p className="text-xs text-destructive" role="alert">{errors.slug.message}</p>
            ) : null}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">نبذة عن المتجر</Label>
            <Textarea
              id="bio"
              rows={3}
              placeholder="سطر أو سطران يشرحان ما تبيعه، مثال: متجر جزائري متخصص في الهدايا والزهور الاصطناعية مع التوصيل إلى 58 ولاية."
              aria-invalid={!!errors.bio}
              {...register("bio")}
            />
            {errors.bio ? (
              <p className="text-xs text-destructive" role="alert">{errors.bio.message}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">التواصل والتوصيل</CardTitle>
          <CardDescription>
            الزبائن سيستعملون هذه المعلومات للطلب والتواصل معك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">رقم واتساب</Label>
            <Input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              dir="ltr"
              className="text-start"
              placeholder="0550123456"
              aria-invalid={!!errors.whatsapp}
              {...register("whatsapp")}
            />
            {errors.whatsapp ? (
              <p className="text-xs text-destructive" role="alert">{errors.whatsapp.message}</p>
            ) : null}
          </div>

          {/* Instagram / Facebook */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instagram">إنستغرام (اختياري)</Label>
              <Input
                id="instagram"
                dir="ltr"
                className="text-start"
                placeholder="@my.shop"
                {...register("instagram")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">فيسبوك (اختياري)</Label>
              <Input
                id="facebook"
                dir="ltr"
                className="text-start"
                placeholder="صفحتك على فيسبوك"
                {...register("facebook")}
              />
            </div>
          </div>

          {/* Default delivery fee */}
          <div className="space-y-2">
            <Label htmlFor="defaultDeliveryFee">سعر التوصيل الافتراضي (دينار)</Label>
            <Input
              id="defaultDeliveryFee"
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              dir="ltr"
              className="text-start"
              aria-invalid={!!errors.defaultDeliveryFee}
              {...register("defaultDeliveryFee")}
            />
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_FEES.map((fee) => (
                <button
                  key={fee.value}
                  type="button"
                  className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
                  onClick={() => setValue("defaultDeliveryFee", fee.value, { shouldValidate: true })}
                >
                  {fee.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              يمكنك تعديل سعر التوصيل لكل ولاية لاحقًا من صفحة «التوصيل».
            </p>
            {errors.defaultDeliveryFee ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.defaultDeliveryFee.message}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {serverError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          يمكنك تعديل كل شيء لاحقًا من الإعدادات
        </p>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          إنشاء المتجر
        </Button>
      </div>
    </form>
  );
}
