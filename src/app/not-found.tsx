import Link from "next/link";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Store className="size-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-xl font-extrabold">الصفحة غير موجودة</h1>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          قد يكون الرابط خاطئًا أو أن المتجر الذي تبحث عنه غير متوفر بعد.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/">الانتقال إلى mahalli.app</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">أنشئ متجرك</Link>
        </Button>
      </div>
    </div>
  );
}
