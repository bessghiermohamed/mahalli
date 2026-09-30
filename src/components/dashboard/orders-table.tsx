"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { formatDZD, formatDate, num } from "@/lib/utils";
import type { OrderWithRelations } from "@/types/database";

export function OrdersTable({ orders }: { orders: OrderWithRelations[] }) {
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id} className="rounded-xl border bg-card transition-colors hover:bg-muted/40">
          <Link
            href={`/dashboard/orders/${o.id}`}
            className="flex items-center gap-3 p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold" dir="ltr">
                  {o.order_number}
                </span>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="mt-1 truncate text-sm">
                {o.customer_name}
                <span className="text-muted-foreground">
                  {" "}
                  — {o.wilaya?.name_ar || "—"}، {o.commune}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(o.created_at)}
                {" · "}
                {(o.order_items || []).length} منتج
              </p>
            </div>
            <div className="text-end">
              <p className="font-extrabold">{formatDZD(num(o.total))}</p>
              <p className="mt-0.5 flex items-center justify-end text-xs text-muted-foreground">
                التفاصيل
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
