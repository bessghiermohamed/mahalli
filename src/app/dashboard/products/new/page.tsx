import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductForm } from "@/components/dashboard/product-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "منتج جديد" };

export default function NewProductPage() {
  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ms-2 mb-2 text-muted-foreground">
          <Link href="/dashboard/products">
            <ArrowRight className="size-4" aria-hidden="true" />
            رجوع إلى المنتجات
          </Link>
        </Button>
        <h1 className="text-2xl font-extrabold">إضافة منتج جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          صورة واضحة وسعر واضح = زبون أكثر ثقة
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
