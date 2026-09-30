import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Phone, StickyNote, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { OrderActions } from "@/components/dashboard/order-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDZD, formatDate, num } from "@/lib/utils";
import type { OrderWithRelations } from "@/types/database";

export const metadata = { title: "تفاصيل الطلب" };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, whatsapp")
    .eq("owner_id", user!.id)
    .maybeSingle();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, wilaya:wilayas(code, name_ar, name_fr), order_items(id, product_name_snapshot, unit_price_snapshot, quantity, subtotal)"
    )
    .eq("id", id)
    .eq("store_id", store!.id)
    .maybeSingle();

  if (!order) notFound();

  const o = order as unknown as OrderWithRelations;

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ms-2 mb-2 text-muted-foreground">
          <Link href="/dashboard/orders">
            <ArrowRight className="size-4" aria-hidden="true" />
            كل الطلبات
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-extrabold" dir="ltr">
            {o.order_number}
          </h1>
          <OrderStatusBadge status={o.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          استُلم بتاريخ {formatDate(o.created_at)}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المنتجات المطلوبة</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead className="text-end">المجموع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(o.order_items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product_name_snapshot}
                      </TableCell>
                      <TableCell>{formatDZD(num(item.unit_price_snapshot))}</TableCell>
                      <TableCell>× {item.quantity}</TableCell>
                      <TableCell className="text-end font-semibold">
                        {formatDZD(num(item.subtotal))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">المجموع الفرعي</dt>
                  <dd>{formatDZD(num(o.subtotal))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">التوصيل</dt>
                  <dd>{formatDZD(num(o.delivery_fee))}</dd>
                </div>
                <div className="flex justify-between text-base font-extrabold">
                  <dt>الإجمالي</dt>
                  <dd>{formatDZD(num(o.total))}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الزبون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">{o.customer_name}</span>
              </p>
              <p className="flex items-center gap-2" dir="ltr">
                <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="font-mono">+{o.customer_phone}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>
                  ولاية {o.wilaya?.name_ar}، بلدية {o.commune}
                  <br />
                  {o.address}
                </span>
              </p>
              {o.notes ? (
                <p className="flex items-start gap-2">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>{o.notes}</span>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-lg">إدارة الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderActions
                order={o}
                storeName={store!.name}
                storeWhatsapp={store!.whatsapp}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
