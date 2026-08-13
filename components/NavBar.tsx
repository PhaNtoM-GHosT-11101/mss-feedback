"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-provider";
import { IconHome, IconStats, IconComplaint, IconPraise, IconProfile, IconPlate } from "./icons";

const tabs = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/stats", label: "Stats", Icon: IconStats },
  { href: "/complaints", label: "Issues", Icon: IconComplaint },
  { href: "/praise", label: "Praise", Icon: IconPraise },
  { href: "/profile", label: "Profile", Icon: IconProfile },
];

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-[#F0AE3C] to-[#E8A020] text-[#241A04] shadow-[0_3px_12px_-3px_rgb(232_160_32/0.6)]">
        <IconPlate className="h-5 w-5" strokeWidth={1.7} />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
            MSS Feedback
          </span>
          <span className="mt-0.5 text-[10px] font-medium text-muted">
            Mess made better
          </span>
        </span>
      )}
    </span>
  );
}

export default function NavBar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ============ Desktop sidebar ============ */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface/70 backdrop-blur-xl md:flex">
        <div className="px-5 pb-6 pt-7">
          <Link href="/" className="inline-block">
            <Wordmark />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {tabs.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`tap group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent-soft text-accent-strong"
                    : "text-muted hover:bg-surface2 hover:text-foreground"
                }`}
              >
                <t.Icon
                  className={`h-[19px] w-[19px] ${active ? "text-accent-strong" : "text-muted group-hover:text-foreground"}`}
                  strokeWidth={active ? 2.3 : 1.9}
                />
                {t.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-4">
          <div className="flex items-center justify-between px-2 pb-2">
            <ThemeToggle />
            <Link
              href="/profile"
              className="tap flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-strong transition hover:brightness-95"
              aria-label="Profile"
            >
              {(userName ?? "?")[0]?.toUpperCase()}
            </Link>
          </div>
        </div>
      </aside>

      {/* ============ Mobile header (smart shrink) ============ */}
      <header
        className={`sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md transition-all duration-300 md:hidden ${
          scrolled ? "py-1.5" : "py-2.5"
        }`}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4">
          <Link href="/" className={scrolled ? "scale-95" : ""} style={{ transition: "transform .3s ease" }}>
            <Wordmark compact={scrolled} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/profile"
              className="tap flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-strong"
              aria-label="Profile"
            >
              {(userName ?? "?")[0]?.toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      {/* ============ Mobile bottom nav ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          {tabs.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`tap flex flex-col items-center gap-1 py-2 text-[10px] font-semibold tracking-wide transition ${
                  active ? "text-accent-strong" : "text-muted hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                    active ? "bg-accent-soft" : ""
                  }`}
                >
                  <t.Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 1.8} />
                </span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* spacers */}
      <div className="hidden md:block" />
      <div
        className="md:hidden"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
      />
    </>
  );
}

export function getTabLabel(pathname: string): string | null {
  const tab = tabs.find((t) =>
    t.href === "/" ? pathname === "/" : pathname.startsWith(t.href),
  );
  return tab?.label ?? null;
}
