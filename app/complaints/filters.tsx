"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
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

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
      active
        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
        : "border-zinc-200 bg-transparent text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
    }`;

  return (
    <div>
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          defaultValue={initial.q}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              go({ q: (e.target as HTMLInputElement).value.trim() });
            }
          }}
          placeholder="Search complaints…"
          className="input pl-9"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button className={chip(initial.status === "all")} onClick={() => go({ status: "all" })}>
          All
        </button>
        {["new", "in_progress", "resolved"].map((s) => (
          <button key={s} className={chip(initial.status === s)} onClick={() => go({ status: s })}>
            {statusLabel(s)}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button className={chip(initial.category === "all")} onClick={() => go({ category: "all" })}>
          All categories
        </button>
        {categories.map((c) => (
          <button key={c.id} className={chip(initial.category === c.id)} onClick={() => go({ category: c.id })}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-3 text-xs text-zinc-500">
        <span className="section-label">Sort</span>
        {(["upvotes", "newest"] as const).map((s) => (
          <button
            key={s}
            onClick={() => go({ sort: s })}
            className={
              initial.sort === s
                ? "font-semibold text-zinc-900 dark:text-white"
                : "hover:text-zinc-700 dark:hover:text-zinc-300"
            }
          >
            {s === "upvotes" ? "Most upvoted" : "Newest"}
          </button>
        ))}
      </div>
    </div>
  );
}
