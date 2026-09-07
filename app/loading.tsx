export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-2 md:px-6">
      <div className="border-b border-border pb-5 pt-7">
        <div className="h-3 w-24 animate-pulse rounded bg-surface2" />
        <div className="mt-3 h-8 w-52 animate-pulse rounded bg-surface2" />
        <div className="mt-2 h-3 w-72 animate-pulse rounded bg-surface2" />
      </div>
      <div className="mt-2 divide-y divide-border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 py-4">
            <div className="hidden w-12 shrink-0 flex-col items-center gap-1.5 sm:flex">
              <div className="h-4 w-4 animate-pulse rounded bg-surface2" />
              <div className="h-4 w-6 animate-pulse rounded bg-surface2" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-surface2" />
              <div className="h-5 w-full animate-pulse rounded bg-surface2" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}