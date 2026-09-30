"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Globe } from "lucide-react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LocaleToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          disabled={isPending}
          aria-label="تغيير اللغة / Changer de langue"
        >
          <Globe className="size-4" aria-hidden="true" />
          {current === "ar" ? "ع" : "FR"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchTo("ar")}
          aria-current={current === "ar"}
          className={current === "ar" ? "bg-muted" : ""}
        >
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchTo("fr")}
          aria-current={current === "fr"}
          className={current === "fr" ? "bg-muted" : ""}
        >
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
