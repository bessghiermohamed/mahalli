"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageX, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteProductAction,
  toggleProductActiveAction,
} from "@/app/actions/dashboard";
import { formatDZD, num, numOrNull } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ProductWithImages } from "@/types/database";

export function ProductsTable({ products }: { products: ProductWithImages[] }) {
  const router = useRouter();
  const [pendingId, startTransition] = useTransition();

  function onToggle(id: string, active: boolean) {
    startTransition(async () => {
      const result = await toggleProductActiveAction(id, active);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(active ? "تم إظهار المنتج في المتجر" : "تم إخفاء المنتج من المتجر");
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("تم حذف المنتج");
      router.refresh();
    });
  }

  return (
    <ul className="space-y-3">
      {products.map((p) => {
        const image = p.product_images?.[0];
        const stock = numOrNull(p.stock);
        return (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3"
          >
            <div className="img-fallback relative size-16 shrink-0 overflow-hidden rounded-lg sm:size-20">
              {image ? (
                <Image
                  src={image.public_url}
                  alt={`صورة ${p.name}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-xl font-bold text-muted-foreground">
                  {p.name.trim().charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="mt-0.5 text-sm font-semibold text-primary">
                {formatDZD(num(p.price))}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stock === null
                  ? "بدون تتبع للمخزون"
                  : stock === 0
                    ? "نفدت الكمية"
                    : `الكمية المتوفرة: ${stock}`}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={p.active}
                  disabled={pendingId !== null}
                  onCheckedChange={(v) => onToggle(p.id, v)}
                  aria-label={p.active ? "إخفاء المنتج" : "إظهار المنتج"}
                />
                {p.active ? "ظاهر" : "مخفي"}
              </label>
              <Button asChild variant="outline" size="icon" aria-label={`تعديل ${p.name}`}>
                <Link href={`/dashboard/products/${p.id}`}>
                  <Pencil className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    aria-label={`حذف ${p.name}`}
                    disabled={pendingId !== null}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader className="text-start">
                    <AlertDialogTitle>حذف المنتج؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيُحذف «{p.name}» نهائيًا من متجرك. الطلبات القديمة لن تتأثر وستحتفظ
                      بتفاصيلها.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row justify-start gap-2">
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() => onDelete(p.id)}
                    >
                      نعم، احذف المنتج
                    </AlertDialogAction>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        );
      })}
      {products.length === 0 ? (
        <li className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
          <PackageX className="size-4" aria-hidden="true" />
          لا توجد منتجات
        </li>
      ) : null}
    </ul>
  );
}
