"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/storefront/cart-provider";
import { getDict, type Locale } from "@/lib/i18n";
import { formatDZD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
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

export function CartView({ storeSlug, locale }: { storeSlug: string; locale: Locale }) {
  const t = getDict(locale);
  const cart = useCart();

  if (!cart.ready) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={t.cartEmpty}
        description={t.cartEmptyHint}
        action={
          <Button asChild size="sm">
            <Link href={`/${storeSlug}`}>{t.browseProducts}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {cart.items.map((item) => (
          <li key={item.productId} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="img-fallback relative size-16 shrink-0 overflow-hidden rounded-lg">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-lg font-bold text-muted-foreground">
                  {item.name.trim().charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.name}</p>
              <p className="mt-0.5 text-sm font-bold text-primary">
                {formatDZD(item.price, locale)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center rounded-lg border">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => cart.setQty(item.productId, item.qty - 1)}
                    aria-label={`تقليل كمية ${item.name}`}
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold" aria-live="polite">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                    onClick={() => cart.setQty(item.productId, item.qty + 1)}
                    disabled={item.stock !== null && item.qty >= item.stock}
                    aria-label={`زيادة كمية ${item.name}`}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => cart.remove(item.productId)}
                  aria-label={`حذف ${item.name} من السلة`}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  {t.remove}
                </button>
              </div>
            </div>

            <p className="shrink-0 text-sm font-extrabold">
              {formatDZD(item.price * item.qty, locale)}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <div>
          <p className="text-sm text-muted-foreground">{t.subtotal}</p>
          <p className="text-lg font-extrabold">{formatDZD(cart.subtotal, locale)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.deliveryNote}</p>
        </div>
        <Button asChild size="lg">
          <Link href={`/${storeSlug}/checkout`}>{t.checkout}</Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${storeSlug}`}>{t.continueShopping}</Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t.clearCart}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader className="text-start">
              <AlertDialogTitle>{t.clearCart}</AlertDialogTitle>
              <AlertDialogDescription>{t.clearCartConfirm}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-start gap-2">
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={cart.clear}
              >
                {t.clearCart}
              </AlertDialogAction>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
