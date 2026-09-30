"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { productSchema, type ProductFormInput } from "@/lib/validations/product";
import { saveProductAction } from "@/app/actions/dashboard";
import { BUCKETS, MAX_PRODUCT_IMAGES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ExistingImage {
  id?: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
}

export function ProductForm({
  productId,
  defaultValues,
  initialImages,
}: {
  productId?: string;
  defaultValues?: Partial<ProductFormInput>;
  initialImages?: ExistingImage[];
}) {
  const router = useRouter();
  const [images, setImages] = useState<ExistingImage[]>(initialImages || []);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: undefined,
      stock: undefined,
      active: true,
      ...defaultValues,
    },
  });

  const activeValue = watch("active");
  const nameValue = watch("name");

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_PRODUCT_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`الحد الأقصى ${MAX_PRODUCT_IMAGES} صور للمنتج`);
      return;
    }
    const picked = files.slice(0, remaining);

    try {
      setUploadingCount(picked.length);
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        toast.error("انتهت الجلسة، سجّل الدخول من جديد");
        return;
      }

      const uploaded: ExistingImage[] = [];
      for (const file of picked) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`الصورة «${file.name}» أكبر من 10 ميغابايت`);
          continue;
        }
        const blob = await compressImage(file, 1200, 0.82);
        const path = `${uid}/p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error } = await supabase.storage
          .from(BUCKETS.productImages)
          .upload(path, blob, { contentType: "image/jpeg" });
        if (error) {
          toast.error(`تعذّر رفع «${file.name}»`);
          continue;
        }
        const { data: pub } = supabase.storage.from(BUCKETS.productImages).getPublicUrl(path);
        uploaded.push({ storage_path: path, public_url: pub.publicUrl, sort_order: 0 });
      }
      setImages((prev) =>
        [...prev, ...uploaded].map((img, i) => ({ ...img, sort_order: i }))
      );
    } finally {
      setUploadingCount(0);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, sort_order: i })));
  }

  function makeMain(index: number) {
    setImages((prev) => {
      const copy = [...prev];
      const [picked] = copy.splice(index, 1);
      return [picked, ...copy].map((img, i) => ({ ...img, sort_order: i }));
    });
  }

  function onSubmit(values: ProductFormInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveProductAction({
        id: productId,
        product: values,
        images: images.map((img, i) => ({
          storage_path: img.storage_path,
          public_url: img.public_url,
          sort_order: i,
        })),
      });
      if (result && "error" in result && result.error) {
        setServerError(result.error);
        return;
      }
      toast.success(productId ? "تم حفظ تعديلات المنتج" : "تمت إضافة المنتج بنجاح");
      router.push("/dashboard/products");
      router.refresh();
    });
  }

  const busy = isPending || uploadingCount > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تفاصيل المنتج</CardTitle>
          <CardDescription>الاسم والسعر والوصف كما ستظهر للزبائن</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المنتج</Label>
            <Input
              id="name"
              placeholder="مثال: طقم أكواب قهوة مغربية"
              aria-invalid={!!errors.name}
              {...register("name", {
                onBlur: () => {
                  const current = watch("slug");
                  if (!current && nameValue) {
                    setValue("slug", slugify(nameValue));
                  }
                },
              })}
            />
            {errors.name ? (
              <p className="text-xs text-destructive" role="alert">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">السعر (دينار)</Label>
              <Input
                id="price"
                type="number"
                inputMode="numeric"
                min={1}
                step={50}
                dir="ltr"
                className="text-start"
                placeholder="4500"
                aria-invalid={!!errors.price}
                {...register("price")}
              />
              {errors.price ? (
                <p className="text-xs text-destructive" role="alert">{errors.price.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">الكمية المتوفرة (اختياري)</Label>
              <Input
                id="stock"
                type="number"
                inputMode="numeric"
                min={0}
                dir="ltr"
                className="text-start"
                placeholder="اتركه فارغًا إن لم تكن تتابع المخزون"
                aria-invalid={!!errors.stock}
                {...register("stock")}
              />
              {errors.stock ? (
                <p className="text-xs text-destructive" role="alert">{errors.stock.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف المنتج</Label>
            <Textarea
              id="description"
              rows={5}
              placeholder="اكتب وصفًا واضحًا: الخامة، المقاسات، طريقة الاستعمال، وأي معلومات مهمة للزبون."
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="active" className="text-sm">إظهار المنتج في المتجر</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                أوقفه مؤقتًا عند نفاد الكمية دون حذفه
              </p>
            </div>
            <Switch
              id="active"
              checked={activeValue}
              onCheckedChange={(v) => setValue("active", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="size-5 text-primary" aria-hidden="true" />
            صور المنتج
          </CardTitle>
          <CardDescription>
            حتى {MAX_PRODUCT_IMAGES} صور. الصورة الأولى هي الصورة الرئيسية.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div
                key={img.storage_path}
                className="group relative size-24 overflow-hidden rounded-lg border"
              >
                <Image
                  src={img.public_url}
                  alt={`صورة ${i + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {i === 0 ? (
                  <span className="absolute start-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    رئيسية
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeMain(i)}
                    className="absolute start-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    aria-label="تعيين كصورة رئيسية"
                  >
                    <Star className="size-3" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute end-1 top-1 rounded bg-black/60 p-1 text-white transition-opacity hover:bg-destructive focus:opacity-100"
                  aria-label="حذف الصورة"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                </button>
              </div>
            ))}

            {images.length < MAX_PRODUCT_IMAGES ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted"
                aria-label="إضافة صور"
              >
                <UploadCloud className="size-5" aria-hidden="true" />
                <span className="text-xs">إضافة صور</span>
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="sr-only"
            onChange={onFilesSelected}
          />
          {uploadingCount > 0 ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              جارٍ رفع الصور...
            </p>
          ) : null}
        </CardContent>
      </Card>

      {serverError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={busy}
        >
          إلغاء
        </Button>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {productId ? "حفظ التعديلات" : "إضافة المنتج"}
        </Button>
      </div>
    </form>
  );
}
