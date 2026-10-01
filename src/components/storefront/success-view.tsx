"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { getDict, type Locale } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";
import { formatDZD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_LOCALE } from "@/lib/i18n";

interface OrderSummary {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  commune: string;
  address: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  wilaya: { code: number; name_ar: string; name_fr: string } | null;
  items: { name: string; quantity: number; subtotal: number }[];
  storeSlug: string;
  storeName?: string;
  storeWhatsapp?: string;
}

export function SuccessView({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const params = useSearchParams();
  const orderNumber = params.get("n") || "";
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const raw = sessionStorage.getItem(`mahalli.order.${orderNumber}`);
        if (raw) setOrder(JSON.parse(raw) as OrderSummary);
      } catch {
        // summary unavailable — show the minimal confirmation
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  const storeSlug = order?.storeSlug || "";

  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="space-y-5 p-6 text-center">
        <CheckCircle2 className="animate-success-pop mx-auto size-14 text-emerald-500" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-extrabold">{t.orderPlaced}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {t.orderPlacedHint}
          </p>
        </div>

        {orderNumber ? (
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">{t.orderNumber}</p>
            <p className="mt-1 font-mono text-lg font-extrabold tracking-wide" dir="ltr">
              {orderNumber}
            </p>
          </div>
        ) : null}

        {order ? (
          <div className="space-y-3 text-start">
            <ul className="space-y-1.5 text-sm">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">
                    {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatDZD(item.subtotal, locale)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t pt-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.subtotal}</dt>
                <dd>{formatDZD(order.subtotal, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.delivery}</dt>
                <dd>{formatDZD(order.delivery_fee, locale)}</dd>
              </div>
              <div className="flex justify-between font-extrabold">
                <dt>{t.total}</dt>
                <dd>{formatDZD(order.total, locale)}</dd>
              </div>
            </dl>
            {order.wilaya ? (
              <p className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                {order.customer_name} — {locale === "fr" ? order.wilaya.name_fr : order.wilaya.name_ar}،{" "}
                {order.commune}، {order.address}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {order?.storeWhatsapp ? (
            <Button
              asChild
              className="bg-[#25D366] text-white hover:bg-[#1eb857]"
            >
              <a
                href={waLink(order.storeWhatsapp, "")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {t.contactStore}
              </a>
            </Button>
          ) : null}
          {storeSlug ? (
            <Button asChild variant="outline">
              <Link href={`/${storeSlug}`}>{t.continueShopping}</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function SuccessFallback({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="space-y-4 p-6 text-center">
        <CheckCircle2 className="animate-success-pop mx-auto size-14 text-emerald-500" aria-hidden="true" />
        <h2 className="text-xl font-extrabold">{t.orderPlaced}</h2>
        <p className="text-sm text-muted-foreground">{t.orderPlacedHint}</p>
        <Button asChild variant="outline">
          <Link href="/">{t.goHome}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
