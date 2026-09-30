"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/app/actions/dashboard";
import { buildOrderMessageAr, waLink } from "@/lib/whatsapp";
import { ORDER_STATUSES, ORDER_STATUS_LABELS_AR } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderStatus, OrderWithRelations } from "@/types/database";

export function OrderActions({
  order,
  storeName,
  storeWhatsapp,
}: {
  order: OrderWithRelations;
  storeName: string;
  storeWhatsapp: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function onStatusChange(status: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatusAction(order.id, status);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`تم تحديث الحالة إلى «${ORDER_STATUS_LABELS_AR[status]}»`);
      router.refresh();
    });
  }

  function copyPhone() {
    navigator.clipboard.writeText(formatPhone(order.customer_phone)).then(() => {
      setCopied(true);
      toast.success("تم نسخ رقم الهاتف");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const message = buildOrderMessageAr(
    {
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      commune: order.commune,
      address: order.address,
      notes: order.notes,
      wilaya_name_ar: order.wilaya?.name_ar ?? null,
      items: (order.order_items || []).map((i) => ({
        name: i.product_name_snapshot,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
    },
    storeName
  );

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">تحديث حالة الطلب</p>
        <Select
          value={order.status}
          onValueChange={(v) => onStatusChange(v as OrderStatus)}
          disabled={isPending}
        >
          <SelectTrigger aria-label="حالة الطلب" className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABELS_AR[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">إرسال الطلب عبر واتساب</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-[#25D366] text-white hover:bg-[#1eb857]">
            <a href={waLink(storeWhatsapp, message)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" aria-hidden="true" />
              إرسال إلى الزبون
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(message);
              toast.success("تم نسخ نص الرسالة");
            }}
          >
            <Copy className="size-4" aria-hidden="true" />
            نسخ نص الرسالة
          </Button>
          <Button variant="outline" onClick={copyPhone}>
            <Copy className="size-4" aria-hidden="true" />
            نسخ رقم الزبون
          </Button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          تُفتح محادثة واتساب مع الزبون تحتوي رسالة جاهزة بتفاصيل الطلب: رقم الطلب، المنتجات،
          الكميات، الإجمالي والعنوان.
        </p>
      </div>
    </div>
  );
}

function formatPhone(e164: string): string {
  return e164.startsWith("213") ? `0${e164.slice(3)}` : e164;
}
