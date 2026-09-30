import Link from "next/link";
import { Store } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-extrabold"
            aria-label="الانتقال إلى الصفحة الرئيسية"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-5" aria-hidden="true" />
            </span>
            محلي
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
