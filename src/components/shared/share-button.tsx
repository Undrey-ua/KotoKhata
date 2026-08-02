"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShareButtonProps = {
  title: string;
  label?: string;
};

export function ShareButton({ title, label = "Поділитись" }: ShareButtonProps) {
  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled */
      }
    }

    await navigator.clipboard.writeText(url);
  }

  return (
    <Button type="button" variant="outline" onClick={handleShare}>
      <Share2 className="h-4 w-4" />
      {label}
    </Button>
  );
}
