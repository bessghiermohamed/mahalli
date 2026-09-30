"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/storefront/cart-provider";
import { getDict, type Locale } from "@/lib/i18n";

export function CartBadge({
  storeSlug,
  locale,
}: {
  storeSlug: string;
  locale: Locale;
}) {
  const { count, ready } = useCart();
  const t = getDict(locale);

  return (
    <Link
      href={`/${storeSlug}/cart`}
      className="relative inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      aria-label={`${t.cart}${ready && count > 0 ? ` — ${t.itemsInCart(count)}` : ""}`}
    >
      <ShoppingCart className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">{t.cart}</span>
      {ready && count > 0 ? (
        <span className="absolute -top-1.5 -end-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white">
          {count > 99 ? "+99" : count}
        </span>
      ) : null}
    </Link>
  );
}
