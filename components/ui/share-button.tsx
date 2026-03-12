"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "./share-modal";

interface ShareButtonProps {
  cardType: "driver" | "head-to-head" | "race-result" | "standings";
  params: Record<string, string>;
  label?: string;
}

export function ShareButton({ cardType, params, label }: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-glow/30 hover:text-glow"
      >
        <Share2 className="size-3.5" />
        {label ?? "Share"}
      </button>
      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        cardType={cardType}
        params={params}
      />
    </>
  );
}
