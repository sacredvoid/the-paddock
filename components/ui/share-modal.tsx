"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Download, Link2, Check, Sun, Moon, Square, RectangleHorizontal } from "lucide-react";

type ThemeMode = "dark" | "light";
type CardSize = "square" | "landscape";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  cardType: "driver" | "head-to-head" | "race-result" | "standings";
  params: Record<string, string>;
}

export function ShareModal({ open, onClose, cardType, params }: ShareModalProps) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [size, setSize] = useState<CardSize>("square");
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Build OG image URL
  const buildImageUrl = useCallback(
    (t: ThemeMode, s: CardSize) => {
      const searchParams = new URLSearchParams(params);
      searchParams.set("theme", t);
      searchParams.set("size", s);
      return `/api/og/${cardType}?${searchParams.toString()}`;
    },
    [cardType, params]
  );

  const imageUrl = buildImageUrl(theme, size);

  // Build the full shareable URL (page URL, not image URL)
  const buildShareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Reset copied state after feedback
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  // Prevent scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cardType}-${Object.values(params).join("-")}-${size}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle download errors
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      setCopied(true);
    } catch {
      // Silently handle clipboard errors
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0C0C0E] p-5 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
        >
          <X className="size-4" />
        </button>

        {/* Title */}
        <h3 className="mb-4 text-lg font-bold text-text-primary">Share Card</h3>

        {/* Preview */}
        <div className="mb-4 overflow-hidden rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${cardType} share card preview`}
            className="w-full"
          />
        </div>

        {/* Controls row */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Theme toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 p-0.5">
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                theme === "dark"
                  ? "bg-glow/10 text-glow"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Moon className="size-3" />
              Dark
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                theme === "light"
                  ? "bg-glow/10 text-glow"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Sun className="size-3" />
              Light
            </button>
          </div>

          {/* Size toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 p-0.5">
            <button
              onClick={() => setSize("square")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                size === "square"
                  ? "bg-glow/10 text-glow"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Square className="size-3" />
              Square
            </button>
            <button
              onClick={() => setSize("landscape")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                size === "landscape"
                  ? "bg-glow/10 text-glow"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <RectangleHorizontal className="size-3" />
              Landscape
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-glow px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-glow/80"
          >
            <Download className="size-4" />
            Download PNG
          </button>
          <button
            onClick={handleCopyLink}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-glow/30 hover:text-glow"
          >
            {copied ? (
              <>
                <Check className="size-4" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="size-4" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
