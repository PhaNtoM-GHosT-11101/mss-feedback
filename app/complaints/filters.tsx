"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/types";
import { statusLabel } from "@/lib/format";

export default function FilterBar({
  categories,
  initial,
}: {
  categories: Category[];
  initial: { status: string; category: string; q: string; sort: "upvotes" | "newest" };
}) {
  const router = useRouter();
  const params = useSearchParams();

  function go(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === "all" || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `/complaints?${qs}` : "/complaints", { scroll: false });
  }

  return (
    <div>
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          className={`chip ${initial.status === "all" ? "chip-active" : ""}`}
          onClick={() => go({ status: "all" })}
        >
          All
        </button>
        {["new", "in_progress", "resolved"].map((s) => (
          <button
            key={s}
            className={`chip ${initial.status === s ? "chip-active" : ""}`}
            onClick={() => go({ status: s })}
          >
            {statusLabel(s)}
          </button>
        ))}
        <span className="my-auto ml-1 h-4 w-px shrink-0 bg-border" />
        <button
          className={`chip ${initial.category === "all" ? "chip-active" : ""}`}
          onClick={() => go({ category: "all" })}
        >
          All categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`chip ${initial.category === c.id ? "chip-active" : ""}`}
            onClick={() => go({ category: c.id })}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3 text-xs text-muted">
        <span className="section-label">Sort</span>
        {(["upvotes", "newest"] as const).map((s) => (
          <button
            key={s}
            onClick={() => go({ sort: s })}
            className={
              initial.sort === s
                ? "font-semibold text-[--accent-strong]"
                : "hover:text-foreground"
            }
          >
            {s === "upvotes" ? "Most upvoted" : "Newest"}
          </button>
        ))}
      </div>
    </div>
  );
}