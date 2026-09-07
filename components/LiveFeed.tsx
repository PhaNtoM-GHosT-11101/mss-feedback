"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 30000;

export default function LiveFeed({
  children,
  liveLabel = "Live",
}: {
  children: ReactNode;
  liveLabel?: string;
}) {
  const router = useRouter();
  const firstRun = useRef(true);

  useEffect(() => {
    const t = setInterval(() => {
      // Cheap gate: skip when the tab isn't visible or focused so we don't burn
      // serverless invocations on background tabs.
      if (document.hidden || !document.hasFocus?.()) return;
      router.refresh();
      firstRun.current = false;
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div>
      <div className="flex items-center gap-2 px-1 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
          {liveLabel}
        </span>
        <span className="h-px flex-1 bg-border/70" />
        <span className="text-[10.5px] font-medium text-muted">
          refreshes automatically
        </span>
      </div>

      <div className="mt-1 divide-y divide-border">{children}</div>
    </div>
  );
}