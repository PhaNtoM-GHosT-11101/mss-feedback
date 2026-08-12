"use client";

import { useState } from "react";
import { useMeasuredWidth } from "./use-measure";

type Point = { label: string; overall: number | null; meals: Record<string, number> };

export function AreaTrend({
  data,
  mealNames,
  height = 220,
}: {
  data: Point[];
  mealNames: string[];
  height?: number;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>(100);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const seriesList = ["overall", ...mealNames];
  const colors: Record<string, string> = {
    overall: "var(--chart-1)",
    ...Object.fromEntries(mealNames.map((n, i) => [n, `var(--chart-${((i % 4) + 2)})`])),
  };

  const alive = data.filter((p) => p.overall !== null);
  if (alive.length === 0 || width < 40) {
    return (
      <div ref={ref} className="py-8 text-center text-sm text-gray-400">
        No ratings yet this month.
      </div>
    );
  }

  const min = 1;
  const max = 5;
  const PX = 30;
  const PY = 14;
  const W = width;
  const bareH = height;
  const H = bareH + 24; // reserved for axis labels
  const chartW = W - PX - 6;
  const chartH = bareH - PY;

  const y = (v: number) => PY + chartH - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * chartH;
  const x = (i: number) => PX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);

  const visible = (name: string) => !hidden.has(name);

  function toggle(name: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function renderSeries(name: string) {
    if (!visible(name)) return null;
    const color = colors[name];
    const pts = data
      .map((d, i) => ({ i, v: name === "overall" ? d.overall : d.meals[name] ?? null }))
      .filter((p) => p.v !== null && p.v !== undefined) as { i: number; v: number }[];

    if (pts.length === 0) return null;

    const line = pts.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i)},${y(p.v)}`).join(" ");
    const area =
      pts.length > 1
        ? `${line} L${x(pts[pts.length - 1].i)},${PY + chartH} L${x(pts[0].i)},${PY + chartH} Z`
        : null;

    return (
      <g key={name}>
        {area && <path d={area} fill={color} fillOpacity="0.08" stroke="none" />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={name === "overall" ? 2.5 : 1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {pts.map((p) => (
          <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={name === "overall" ? 3 : 2.2} fill={color} />
        ))}
      </g>
    );
  }

  const lastIndex = data.length - 1;
  const lastOverall = data[lastIndex]?.overall;

  return (
    <div ref={ref} className="relative mt-4">
      {width > 0 && (
        <svg width={W} height={H} className="block">
          {[1, 2, 3, 4, 5].map((g) => (
            <g key={g}>
              <line
                x1={PX}
                y1={y(g)}
                x2={W - 6}
                y2={y(g)}
                stroke="var(--chart-grid)"
                strokeWidth="1"
                strokeDasharray={g === 1 || g === 5 ? "0" : "3 4"}
              />
              <text x={PX - 5} y={y(g) + 3} textAnchor="end" fontSize="9" fill="var(--chart-axis)">
                {g}
              </text>
            </g>
          ))}

          {seriesList.map((n) => renderSeries(n))}

          {/* x labels: few every-other to avoid crowding */}
          {data.map((d, i) =>
            i % Math.ceil(data.length / 6) === 0 || i === lastIndex ? (
              <text key={i} x={x(i)} y={bareH + 12} textAnchor="middle" fontSize="9" fill="var(--chart-axis)">
                {d.label.slice(5)}
              </text>
            ) : null,
          )}
        </svg>
      )}

      {lastOverall !== null && lastOverall !== undefined && width > 0 && (
        <div
          style={{
            left: x(lastIndex),
            top: y(lastOverall) - 12,
          }}
          className="pointer-events-none absolute"
        >
          <span className="-translate-x-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-white dark:text-zinc-900">
            {lastOverall.toFixed(1)}
          </span>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        {seriesList.map((name) => (
          <button
            key={name}
            onClick={() => toggle(name)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
              visible(name)
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-400 line-through dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            {name === "overall" ? "All meals" : name}
          </button>
        ))}
      </div>
    </div>
  );
}