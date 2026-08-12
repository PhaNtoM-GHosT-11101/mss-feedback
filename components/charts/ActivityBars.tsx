"use client";

import { useMeasuredWidth } from "./use-measure";

type Series = { label: string; values: (number | null)[] };

export function ActivityBars({
  series,
  labels,
  height = 140,
}: {
  series: Series[];
  labels: string[];
  height?: number;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>(100);

  const max = Math.max(1, ...series.flatMap((s) => s.values).map((v) => v ?? 0));

  if (labels.length === 0 || series.every((s) => s.values.every((v) => (v ?? 0) === 0))) {
    return <p className="py-4 text-center text-sm text-gray-400">No activity yet in the last 14 days.</p>;
  }

  const barset = series.length;
  const pad = 2;
  const slotW = width / labels.length;
  const barW = Math.max(2, Math.min(10, (slotW - pad * 2) / barset));

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={height} className="block">
          {series.map((s, si) =>
            s.values.map((v, i) => {
              if (v === null || v === 0) return null;
              const bh = (v / max) * (height - 20);
              const x = i * slotW + pad + si * (barW + 1);
              return (
                <rect
                  key={`${s.label}-${i}`}
                  x={x}
                  y={height - 6 - bh}
                  width={barW}
                  height={bh}
                  rx={Math.min(2, barW / 2)}
                  fill={`var(--chart-${si + 1})`}
                  opacity="0.9"
                />
              );
            }),
          )}
        </svg>
      )}
      <div className="mt-1 flex gap-1">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 truncate text-center text-[9px] text-gray-400">
            {i % 2 === 0 || i === labels.length - 1 ? l.slice(5) : ""}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {series.map((s, si) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: `var(--chart-${si + 1})` }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}