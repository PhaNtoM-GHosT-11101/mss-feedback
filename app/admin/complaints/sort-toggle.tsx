"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortToggle({ current }: { current: "upvotes" | "latest" }) {
  const router = useRouter();
  const params = useSearchParams();

  function go(sort: "upvotes" | "latest") {
    const next = new URLSearchParams(params.toString());
    next.set("sort", sort);
    router.push(`/admin/complaints?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-gray-400">Sort:</span>
      {(["upvotes", "latest"] as const).map((s) => (
        <button
          key={s}
          onClick={() => go(s)}
          className={
            current === s
              ? "font-semibold text-gray-900 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }
        >
          {s === "upvotes" ? "Most votes" : "Latest"}
        </button>
      ))}
    </div>
  );
}
