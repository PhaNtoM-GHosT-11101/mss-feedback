// REVERB — code-drawn abstract monogram.
// Sound-bars fanning forward + an echo arc: "louder together." Sharp, geometric.

export function ReverbMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[0.625rem] bg-gradient-to-br from-accent to-accent-strong shadow-[0_4px_14px_-6px_rgb(79_70_229/0.7)] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 9v5M9 6.5v10M14 5v14" />
        <path d="M17.5 8.5a5 5 0 0 1 0 6" strokeOpacity={0.85} />
        <path d="M20 6a9.5 9.5 0 0 1 0 11" strokeOpacity={0.55} />
      </svg>
    </span>
  );
}

export function ReverbLogo({
  compact = false,
  institutionName,
  tagline,
}: {
  compact?: boolean;
  institutionName?: string;
  tagline?: string | null;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <ReverbMark size={compact ? 26 : 32} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[16px] font-extrabold tracking-[-0.02em] text-foreground">
            REVERB
          </span>
          <span className="mt-0.5 text-[10.5px] font-medium text-muted">
            {tagline || (institutionName ? `${institutionName} · Louder together` : "Louder together")}
          </span>
        </span>
      )}
      {compact && (
        <span className="font-display text-[14px] font-extrabold tracking-[-0.02em] text-foreground">
          REVERB
        </span>
      )}
    </span>
  );
}