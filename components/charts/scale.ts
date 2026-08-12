export function niceLabel(v: number) {
  if (Number.isInteger(v)) return String(v);
  if (v >= 100) return String(Math.round(v));
  return Number.isFinite(v) ? v.toFixed(1) : String(v);
}

export function colorVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}