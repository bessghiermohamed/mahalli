import { cn } from "@/lib/utils";
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABELS_AR } from "@/lib/constants";
import type { OrderStatus } from "@/types/database";

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const label = ORDER_STATUS_LABELS_AR[status] || status;
  const cls = ORDER_STATUS_BADGE_CLASS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        cls || "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}
