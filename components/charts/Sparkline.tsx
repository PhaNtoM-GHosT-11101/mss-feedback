"use client";

import { useMeasuredWidth } from "./use-measure";

export function Sparkline({
  data,
  height = 32,
  stroke = "var(--chart-1)",
}: {
  data: { label: string; value: number | null }[];
  height?: number;
  stroke?: string;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>(100);

  const values = data
    .map((d) => d.value)
    .filter((v): v is number => v !== null && v !== undefined);
  if (values.length === 0 || width < 20) {
    return (
      <div ref={ref} style={{ height }} className="w-full" />
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min === 0 ? 1 : max - min;
  const pad = 3;
  const W = width;
  const H = height;

  const x = (i: number) =>
    values.length === 1
      ? W / 2
      : pad + (i / (values.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const area = `${line} L${values.length - 1 === 0 ? x(0) : x(values.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      <svg width={W} height={H} className="block">
        <path d={area} fill={stroke} fillOpacity="0.12" stroke="none" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="2.5" fill={stroke} />
      </svg>
    </div>
  );
}