import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "غير مصرّح" };

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10">
        <ShieldAlert className="size-7 text-amber-600" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-xl font-extrabold">لا تملك صلاحية الوصول</h1>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          هذه المنطقة مخصصة لأصحاب المتاجر المسجلين. سجّل الدخول بالحساب الصحيح أو أنشئ
          متجرك الخاص مجانًا.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">إنشاء حساب</Link>
        </Button>
      </div>
    </div>
  );
}
