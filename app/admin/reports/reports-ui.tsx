"use client";

export function TrendChart({
  data,
  mealNames,
}: {
  data: { label: string; overall: number | null; meals: Record<string, number> }[];
  mealNames: string[];
}) {
  if (data.length === 0) return <p className="mt-3 text-sm text-gray-400">No ratings yet this month.</p>;

  const min = 1;
  const max = 5;

  const W = 560;
  const H = 180;
  const PX = 34;
  const PY = 14;
  const chartW = W - PX * 2;
  const chartH = H - PY * 2;

  function y(v: number) {
    return PY + chartH - ((v - min) / (max - min)) * chartH;
  }
  function x(i: number) {
    return PX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  }

  const gridLines = [1, 2, 3, 4, 5];

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px]">
        {gridLines.map((g) => (
          <g key={g}>
            <line x1={PX} y1={y(g)} x2={W - PX} y2={y(g)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PX - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
              {g}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          if (d.overall === null || d.overall === undefined) return null;
          const cx = x(i);
          const prev = data[i - 1];
          const hasPrev = prev && prev.overall !== null && prev.overall !== undefined;
          return (
            <g key={d.label}>
              {hasPrev && (
                <line
                  x1={x(i - 1)}
                  y1={y(prev.overall as number)}
                  x2={cx}
                  y2={y(d.overall)}
                  stroke="#059669"
                  strokeWidth="2"
                />
              )}
              <circle cx={cx} cy={y(d.overall)} r="3" fill="#059669" />
              <text x={cx} y={H - 2} textAnchor="middle" fontSize="8" fill="#9ca3af">
                {d.label.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-1">
        {mealNames.map((name) => (
          <span key={name} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ExportButtons({ ratingsCSV, complaintsCSV }: { ratingsCSV: string; complaintsCSV: string }) {
  function download(name: string, content: string) {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => download("ratings.csv", ratingsCSV)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        Export ratings CSV
      </button>
      <button
        onClick={() => download("complaints.csv", complaintsCSV)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        Export complaints CSV
      </button>
    </div>
  );
}
