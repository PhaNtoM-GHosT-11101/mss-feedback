"use client";

type Segment = { label: string; value: number; color: string };

const SIZE = 110;
const R = 42;
const C = 2 * Math.PI * R;

export function Donut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Segment[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">No data yet.</p>
    );
  }

  const arcs = segments.reduce<{ seg: Segment; start: number; len: number }[]>((acc, seg) => {
    const start = acc.length === 0 ? 0 : acc[acc.length - 1].start + acc[acc.length - 1].len;
    return [...acc, { seg, start, len: seg.value / total }];
  }, []);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-28 w-28 shrink-0">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--chart-grid)" strokeWidth="12" />
        {arcs.map(({ seg, start, len }) => (
          <circle
            key={seg.label}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={`${Math.max(0, len * C - 1.5)} ${C}`}
            strokeDashoffset={-start * C}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            strokeLinecap="butt"
          />
        ))}
        <text
          x={SIZE / 2}
          y={SIZE / 2 - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground"
          fontSize="16"
          fontWeight="700"
        >
          {centerValue ?? String(total)}
        </text>
        {centerLabel && (
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 13}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="var(--chart-axis)"
          >
            {centerLabel}
          </text>
        )}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: seg.color }}
            />
            <span className="capitalize text-gray-600 dark:text-gray-300">{seg.label}</span>
            <span className="ml-auto font-medium">{seg.value}</span>
            <span className="w-9 text-right text-xs text-gray-400">
              {((seg.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}