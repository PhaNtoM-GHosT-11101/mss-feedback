"use client";

import { useEffect, useRef, useState } from "react";
import { IconShare, IconWhatsApp, IconCheck } from "./icons";

export default function ShareMenu({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const url = typeof window !== "undefined" ? window.location.origin + href : href;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      setOpen(false);
    } catch {
      /* clipboard blocked */
    }
  };

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setOpen(false);
      }
    } catch {
      /* user dismissed */
    }
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;
  const supportsShare = typeof window !== "undefined" && "share" in navigator;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tap inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12.5px] font-medium text-muted transition hover:bg-surface2 hover:text-foreground"
        aria-label="Share"
        aria-expanded={open}
      >
        <IconShare className="h-[15px] w-[15px]" />
        Share
      </button>

      {open && (
        <div className="card anim-scale-in absolute right-0 top-7 z-50 w-52 origin-top-right p-1.5 shadow-xl shadow-black/10">
          <button
            type="button"
            onClick={async () => {
              window.open(whatsapp, "_blank", "noopener,noreferrer");
              setOpen(false);
            }}
            className="tap flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-foreground transition hover:bg-surface2"
          >
            <IconWhatsApp className="h-4 w-4 text-emerald-500" />
            Share to WhatsApp
          </button>
          <button
            type="button"
            onClick={copy}
            className="tap flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-foreground transition hover:bg-surface2"
          >
            <IconCheck className={`h-4 w-4 ${copied ? "text-emerald-500" : "text-muted"}`} />
            {copied ? "Link copied" : "Copy link"}
          </button>
          {supportsShare && (
            <button
              type="button"
              onClick={nativeShare}
              className="tap flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-foreground transition hover:bg-surface2"
            >
              <IconShare className="h-4 w-4 text-muted" />
              Share…
            </button>
          )}
        </div>
      )}
    </div>
  );
}