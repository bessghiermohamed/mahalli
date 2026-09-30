import { formatDZD } from "@/lib/utils";
import { waNumber } from "@/lib/phone";
import type { PublicOrderResult, Store } from "@/types/database";
import { num } from "@/lib/utils";

/** Normalized message input used for both dashboard and public orders. */
export interface OrderMessageInput {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  commune: string;
  address: string;
  notes: string | null;
  wilaya_name_ar?: string | null;
  items: { name: string; quantity: number; subtotal: number }[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}

/** Pre-filled Arabic order message for the seller to send via WhatsApp. */
export function buildOrderMessageAr(
  order: OrderMessageInput,
  storeName: string
): string {
  const lines: string[] = [];
  lines.push(`مرحبا ${storeName}، طلب جديد من Mahalli`);
  lines.push("");
  lines.push(`*رقم الطلب:* ${order.order_number}`);
  lines.push(`*الاسم:* ${order.customer_name}`);
  lines.push(`*الهاتف:* ${formatPhoneDisplay(order.customer_phone)}`);
  lines.push("");
  lines.push("*المنتجات:*");
  for (const item of order.items) {
    lines.push(
      `- ${item.name} × ${item.quantity} = ${formatDZD(num(item.subtotal))}`
    );
  }
  lines.push("");
  lines.push(`*المجموع الفرعي:* ${formatDZD(num(order.subtotal))}`);
  lines.push(`*التوصيل:* ${formatDZD(num(order.delivery_fee))}`);
  lines.push(`*الإجمالي:* ${formatDZD(num(order.total))}`);
  lines.push("");
  lines.push(
    `*العنوان:* ولاية ${order.wilaya_name_ar || "—"}، بلدية ${order.commune}، ${order.address}`
  );
  if (order.notes) {
    lines.push(`*ملاحظات:* ${order.notes}`);
  }
  lines.push("");
  lines.push("يرجى تأكيد الطلب، وشكرًا لكم!");
  return lines.join("\n");
}

function formatPhoneDisplay(e164: string): string {
  return e164.startsWith("213") ? `+${e164}` : e164;
}

export function waLink(phoneE164: string, message: string): string {
  return `https://wa.me/${waNumber(phoneE164)}?text=${encodeURIComponent(message)}`;
}

/** Public result returned by the create_order RPC. */
export function buildOrderMessageFromPublic(
  order: PublicOrderResult,
  store: Store
): string {
  return buildOrderMessageAr(
    {
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      commune: order.commune,
      address: order.address,
      notes: order.notes,
      wilaya_name_ar: order.wilaya?.name_ar ?? null,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
    },
    store.name
  );
}
