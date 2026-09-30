import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "تسجيل الدخول" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; error?: string }>;
}) {
  const params = await searchParams;
  const linkError =
    params.error === "invalid_link"
      ? "رابط التأكيد غير صالح أو منتهي الصلاحية، جرّب مرة أخرى."
      : params.error === "oauth_failed"
        ? "تعذّر تسجيل الدخول بحساب Google، حاول مرة أخرى."
        : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
        <CardDescription>
          أدخل بياناتك للوصول إلى لوحة تحكم متجرك
        </CardDescription>
        {params.reset ? (
          <p
            className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
            role="status"
          >
            تم تغيير كلمة المرور بنجاح، سجّل الدخول بكلمة المرور الجديدة.
          </p>
        ) : null}
        {linkError ? (
          <p
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {linkError}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm next={params.next} />
        <p className="text-center text-sm text-muted-foreground">
          ليس لديك حساب؟{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            أنشئ متجرك مجانًا
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
