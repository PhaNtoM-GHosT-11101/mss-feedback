"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-provider";
import { ReverbLogo } from "./ReverbMark";
import { IconHome, IconProfile, IconPlus, IconSearch } from "./icons";

export function Wordmark({
  compact = false,
  institutionName,
  tagline,
}: {
  compact?: boolean;
  institutionName?: string;
  tagline?: string | null;
}) {
  return <ReverbLogo compact={compact} institutionName={institutionName} tagline={tagline} />;
}

function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    if (q) setQ("");
  }

  return (
    <div
      className={`hidden flex-1 justify-center md:flex ${
        focused ? "scale-[1.01]" : ""
      }`}
      style={{ transition: "transform .15s ease" }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const term = q.trim();
          if (!term) return;
          router.push(`/search?q=${encodeURIComponent(term)}`);
          setQ("");
        }}
        className="relative w-full max-w-sm"
      >
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search complaints across campuses…"
          className="h-9 w-full rounded-lg border border-border bg-surface2/70 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-surface focus:shadow-[0_0_0_3px_rgb(79_70_229/0.15)]"
        />
      </form>
    </div>
  );
}

export default function NavBar({
  userName,
  institutionName,
  tagline,
}: {
  userName?: string;
  institutionName?: string;
  tagline?: string | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onBoards = pathname === "/";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ============ App bar (top, all viewports ============ */}
      <header
        className={`sticky top-0 z-40 border-b border-border/80 transition-all duration-300 ${
          scrolled
            ? "bg-background/85 shadow-[0_4px_18px_-12px_rgb(0_0_0/0.18)] backdrop-blur-xl"
            : "bg-background/60 backdrop-blur-lg"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 md:gap-5">
          {/* Full document navigation — board pages live server-side behind a rewrite */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="inline-block" aria-label="REVERB home">
            {onBoards ? (
              <>
                <span className="hidden sm:block">
                  <ReverbLogo compact={scrolled} />
                </span>
                <span className="sm:hidden">
                  <ReverbLogo compact />
                </span>
              </>
            ) : (
              <>
                <span className="hidden sm:block">
                  <ReverbLogo compact institutionName={institutionName} tagline={tagline} />
                </span>
                <span className="sm:hidden">
                  <ReverbLogo compact />
                </span>
              </>
            )}
          </a>

          <SearchBox />

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/search"
              className="tap flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface2 hover:text-foreground md:hidden"
              aria-label="Search"
            >
              <IconSearch className="h-[18px] w-[18px]" />
            </Link>

            <ThemeToggle />

            <Link
              href="/complaints/new"
              className="tap btn btn-primary hidden h-9 items-center gap-1.5 px-3.5 py-0 text-[13px] sm:inline-flex"
            >
              <IconPlus className="h-4 w-4" strokeWidth={2.4} />
              File complaint
            </Link>

            {/* Full document navigation — profile is reachable from any board */}
            <a
              href="/profile"
              className="tap flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-ink transition hover:brightness-95"
              aria-label="Profile"
            >
              {(userName ?? "?")[0]?.toUpperCase()}
            </a>
          </div>
        </div>
      </header>

      {/* spacer to absorb the fixed/sticky chrome */}
      <div className="h-0" />

      {/* ============ Mobile bottom nav — Home / Post / Profile ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-3">
          {/* Full document navigation — board pages live server-side behind a rewrite */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className={`tap flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition ${
              isActive("/") ? "text-accent-ink" : "text-muted hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                isActive("/") ? "bg-accent-soft" : ""
              }`}
            >
              <IconHome className="h-[18px] w-[18px]" strokeWidth={isActive("/") ? 2.4 : 1.8} />
            </span>
            Home
          </a>

          <Link
            href="/complaints/new"
            className={`tap flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition ${
              pathname === "/complaints/new" ? "text-accent-ink" : "text-muted hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                pathname === "/complaints/new" ? "bg-accent-soft" : ""
              }`}
            >
              <IconPlus className="h-[18px] w-[18px]" strokeWidth={pathname === "/complaints/new" ? 2.4 : 1.8} />
            </span>
            Post
          </Link>

          <Link
            href="/profile"
            className={`tap flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition ${
              isActive("/profile") ? "text-accent-ink" : "text-muted hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                isActive("/profile") ? "bg-accent-soft" : ""
              }`}
            >
              <IconProfile className="h-[18px] w-[18px]" strokeWidth={isActive("/profile") ? 2.4 : 1.8} />
            </span>
            Profile
          </Link>
        </div>
      </nav>

      {/* spacer for the fixed mobile bottom nav */}
      <div
        className="md:hidden"
        style={{ height: "calc(4.25rem + env(safe-area-inset-bottom))" }}
      />
    </>
  );
}