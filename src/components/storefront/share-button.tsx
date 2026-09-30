"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({
  url,
  title,
  label,
}: {
  url: string;
  title: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const nav = navigator as Navigator & {
      share?: (data: { title: string; url: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title, url });
        return;
      } catch (err) {
        // user cancelled the native sheet — do nothing
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(label);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("تعذّر نسخ الرابط");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={onShare} aria-label={label}>
      {copied ? (
        <Check className="size-4 text-primary" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
