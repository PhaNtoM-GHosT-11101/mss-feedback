"use client";

import { useMeasuredWidth } from "./use-measure";

export function HBars({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>(100);
  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">No data yet.</p>;
  }

  const sorted = [...items].sort((a, b) => b.value - a.value);

  return (
    <div ref={ref} className="space-y-2.5">
      {sorted.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate pr-2 text-gray-600 dark:text-gray-300">{item.label}</span>
            <span className="shrink-0 font-medium">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: width ? `${Math.max(2, (item.value / max) * 100)}%` : "0%",
                background: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}