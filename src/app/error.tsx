"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[mahalli] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-xl font-extrabold">حدث خطأ غير متوقع</h1>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          نعتذر عن هذا الخلل المؤقت. يمكنك إعادة المحاولة، وإن استمرت المشكلة فجرّب تحديث
          الصفحة بعد قليل.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCcw className="size-4" aria-hidden="true" />
        إعادة المحاولة
      </Button>
    </div>
  );
}
