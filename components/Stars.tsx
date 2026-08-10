"use client";

type StarsProps = {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
};

export default function Stars({
  value,
  onChange,
  size = "md",
  disabled,
}: StarsProps) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  const cls = sizes[size];

  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled || !onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`${onChange && !disabled ? "cursor-pointer" : "cursor-default"} p-0.5 transition-transform ${onChange && !disabled ? "hover:scale-125" : ""}`}
        >
          <svg
            viewBox="0 0 24 24"
            className={`${cls} ${
              n <= Math.round(value)
                ? "fill-amber-400"
                : "fill-gray-300 dark:fill-gray-600"
            }`}
          >
            <path d="M12 2l2.9 6.26 6.86.56-5.22 4.5 1.58 6.68L12 16.9l-6.12 3.1 1.58-6.68-5.22-4.5 6.86-.56L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function AverageStars({ avg }: { avg: number | null }) {
  if (avg === null || avg === undefined) {
    return <span className="text-sm text-gray-400">—</span>;
  }
  return (
    <span className="flex items-center gap-1 text-sm font-medium">
      <span className="text-amber-500">★</span>
      {avg.toFixed(1)}
    </span>
  );
}
