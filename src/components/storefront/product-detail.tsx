"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/storefront/cart-provider";
import { getDict, type Locale } from "@/lib/i18n";
import { num, numOrNull } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Product, ProductImage } from "@/types/database";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-3">
      <div className="img-fallback relative aspect-square w-full overflow-hidden rounded-xl border">
        {current ? (
          <Image
            src={current.public_url}
            alt={`صورة ${productName}`}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover"
            priority
          />
        ) : (
          <span className="flex size-full items-center justify-center text-6xl font-extrabold text-muted-foreground/40">
            {productName.trim().charAt(0)}
          </span>
        )}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="صور المنتج">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="option"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              <Image
                src={img.public_url}
                alt={`صورة ${i + 1} من ${productName}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AddToCart({
  product,
  storeSlug,
  locale,
}: {
  product: Product & { product_images?: ProductImage[] };
  storeSlug: string;
  locale: Locale;
}) {
  const t = getDict(locale);
  const cart = useCart();
  const stock = numOrNull(product.stock);
  const soldOut = stock === 0;
  const maxQty = stock === null ? 99 : Math.min(stock, 99);

  const [qty, setQty] = useState(1);

  function onAdd() {
    if (soldOut) return;
    cart.add(product, qty);
    toast.success(t.addedToCart);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">{t.quantity}</span>
        <div className="flex items-center rounded-lg border">
          <button
            type="button"
            className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || soldOut}
            aria-label="تقليل الكمية"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="w-10 text-center font-bold" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty || soldOut}
            aria-label="زيادة الكمية"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
        {stock !== null && stock > 0 && stock <= 5 ? (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            {t.lowStock(stock)}
          </span>
        ) : null}
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={onAdd}
        disabled={soldOut || !cart.ready}
      >
        <ShoppingCart className="size-4.5" aria-hidden="true" />
        {soldOut ? t.outOfStock : t.addToCart}
      </Button>
    </div>
  );
}
