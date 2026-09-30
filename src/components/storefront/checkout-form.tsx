"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuid } from "uuid";
import { Banknote, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { checkoutSchema, type CheckoutInput, type CheckoutParsed } from "@/lib/validations/checkout";
import { useCart } from "@/components/storefront/cart-provider";
import { getDict, type Locale } from "@/lib/i18n";
import { formatDZD, num } from "@/lib/utils";
import { resolveDeliveryFee } from "@/lib/delivery";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Wilaya } from "@/types/database";

interface FeeData {
  storeSlug: string;
  storeDefaultFee: number | null;
  overrides: Record<number, number>;
}

const ORDER_MESSAGES: Record<string, (t: ReturnType<typeof getDict>) => string> = {
  OUT_OF_STOCK: (t) => t.outOfStockError,
  PRODUCT_INACTIVE: (t) => t.outOfStockError,
  INVALID_PRODUCTS: (t) => t.priceChanged,
  STORE_NOT_FOUND: (t) => t.orderFailed,
  WILAYA_NOT_FOUND: (t) => t.orderFailed,
  RATE_LIMITED: (t) => t.rateLimited,
};

export function CheckoutForm({
  wilayas,
  feeData,
  locale,
}: {
  wilayas: Wilaya[];
  feeData: FeeData;
  locale: Locale;
}) {
  const t = getDict(locale);
  const router = useRouter();
  const cart = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput, unknown, CheckoutParsed>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      commune: "",
      address: "",
      notes: "",
    },
  });

  const selectedWilaya = watch("wilayaCode");

  const deliveryFee = useMemo(() => {
    const code = Number(selectedWilaya);
    if (!code) return null;
    const w = wilayas.find((x) => x.code === code);
    if (!w) return null;
    return resolveDeliveryFee({
      overrideFee: feeData.overrides[code] ?? null,
      storeDefaultFee: feeData.storeDefaultFee,
      wilayaDefaultFee: num(w.default_delivery_fee),
    });
  }, [selectedWilaya, feeData, wilayas]);

  const subtotal = cart.subtotal;
  const total = subtotal + (deliveryFee ?? 0);

  async function onSubmit(values: CheckoutInput) {
    if (cart.items.length === 0) {
      toast.error(t.cartEmpty);
      return;
    }
    setServerError(null);
    setSubmitting(true);

    const clientRequestId = uuid();
    const payload = {
      storeSlug: feeData.storeSlug,
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.qty })),
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      wilayaCode: Number(values.wilayaCode),
      commune: values.commune,
      address: values.address,
      notes: values.notes || "",
      clientRequestId,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const code = data?.code as string | undefined;
        if (res.status === 429) {
          setServerError(t.rateLimited);
        } else if (code && ORDER_MESSAGES[code]) {
          setServerError(ORDER_MESSAGES[code](t));
        } else if (data?.error) {
          setServerError(String(data.error));
        } else {
          setServerError(t.orderFailed);
        }
        return;
      }

      const order = data.order;
      // Persist summary for the success page, then clear the cart.
      try {
        sessionStorage.setItem(
          `mahalli.order.${order.order_number}`,
          JSON.stringify({ ...order, storeSlug: feeData.storeSlug })
        );
      } catch {
        // non-critical
      }
      cart.clear();
      router.replace(`/${feeData.storeSlug}/checkout/success?n=${encodeURIComponent(order.order_number)}`);
    } catch {
      setServerError(t.orderFailed);
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.ready && cart.items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold">{t.cartEmpty}</p>
          <Button asChild size="sm">
            <a href={`/${feeData.storeSlug}`}>{t.browseProducts}</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-5" noValidate>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg">{t.customerInfo}</CardTitle>
          <CardDescription>{t.codNotice}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">{t.fullName}</Label>
            <Input
              id="customerName"
              autoComplete="name"
              placeholder={t.fullNamePlaceholder}
              aria-invalid={!!errors.customerName}
              {...register("customerName")}
            />
            {errors.customerName ? (
              <p className="text-xs text-destructive" role="alert">{errors.customerName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">{t.phone}</Label>
            <Input
              id="customerPhone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              className="text-start"
              placeholder={t.phonePlaceholder}
              aria-invalid={!!errors.customerPhone}
              {...register("customerPhone")}
            />
            {errors.customerPhone ? (
              <p className="text-xs text-destructive" role="alert">{errors.customerPhone.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t.phoneHint}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wilaya">{t.wilaya}</Label>
              <Select
                value={selectedWilaya ? String(selectedWilaya) : ""}
                onValueChange={(v) => setValue("wilayaCode", Number(v), { shouldValidate: false })}
              >
                <SelectTrigger id="wilaya" aria-invalid={!!errors.wilayaCode}>
                  <SelectValue placeholder={t.wilayaPlaceholder} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {wilayas.map((w) => (
                    <SelectItem key={w.code} value={String(w.code)}>
                      <span dir={locale === "fr" ? "ltr" : undefined}>
                        {locale === "fr" ? w.name_fr : w.name_ar}
                      </span>
                      <span className="ms-1.5 text-xs text-muted-foreground">
                        {String(w.code).padStart(2, "0")}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.wilayaCode ? (
                <p className="text-xs text-destructive" role="alert">{errors.wilayaCode.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commune">{t.commune}</Label>
              <Input
                id="commune"
                placeholder={t.communePlaceholder}
                aria-invalid={!!errors.commune}
                {...register("commune")}
              />
              {errors.commune ? (
                <p className="text-xs text-destructive" role="alert">{errors.commune.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t.address}</Label>
            <Input
              id="address"
              placeholder={t.addressPlaceholder}
              aria-invalid={!!errors.address}
              {...register("address")}
            />
            {errors.address ? (
              <p className="text-xs text-destructive" role="alert">{errors.address.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t.notes}</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder={t.notesPlaceholder}
              aria-invalid={!!errors.notes}
              {...register("notes")}
            />
            {errors.notes ? (
              <p className="text-xs text-destructive" role="alert">{errors.notes.message}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-6 lg:col-span-2 lg:self-start">
        <CardHeader>
          <CardTitle className="text-lg">{t.orderSummary}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="thin-scroll max-h-56 space-y-2.5 overflow-y-auto">
            {cart.ready &&
              cart.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-2.5">
                  <div className="img-fallback relative size-10 shrink-0 overflow-hidden rounded-md">
                    {item.image ? (
                      <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
                        {item.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.qty} × {formatDZD(item.price, locale)}
                    </p>
                  </div>
                  <p className="text-xs font-bold">{formatDZD(item.price * item.qty, locale)}</p>
                </li>
              ))}
          </ul>

          <dl className="space-y-1.5 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.subtotal}</dt>
              <dd className="font-semibold">{formatDZD(subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.delivery}</dt>
              <dd className="font-semibold">
                {deliveryFee === null ? (
                  <span className="text-xs text-muted-foreground">
                    {locale === "ar" ? "اختر الولاية" : "Choisir la wilaya"}
                  </span>
                ) : deliveryFee === 0 ? (
                  t.freeDelivery
                ) : (
                  formatDZD(deliveryFee, locale)
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-extrabold">
              <dt>{t.total}</dt>
              <dd>{formatDZD(total, locale)}</dd>
            </div>
          </dl>

          {serverError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={submitting || !cart.ready}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Banknote className="size-4.5" aria-hidden="true" />
            )}
            {submitting ? t.placingOrder : t.confirmOrder}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t.codNotice}</p>
        </CardContent>
      </Card>
    </form>
  );
}
