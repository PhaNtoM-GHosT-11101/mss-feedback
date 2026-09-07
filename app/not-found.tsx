import { IconHome } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-black text-accent-ink">
        R
      </span>
      <p className="section-label mt-6">Wrong campus?</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-2 text-sm text-muted">
        The complaint was removed, the board was renamed, or the link is stale.
        Head back to the feed.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="tap mt-6 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
      >
        <IconHome className="h-4 w-4" strokeWidth={2} />
        Go to home feed
      </a>
    </main>
  );
}