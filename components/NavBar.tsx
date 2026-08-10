"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Megaphone, PartyPopper, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/complaints", label: "Complaints", Icon: Megaphone },
  { href: "/praise", label: "Praise", Icon: PartyPopper },
  { href: "/profile", label: "Profile", Icon: User },
];

export default function NavBar({ userName }: { userName?: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-background/85 backdrop-blur-md dark:border-zinc-800/80">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-[10px] font-bold tracking-wide text-white dark:bg-white dark:text-zinc-900">
              MSS
            </span>
            <span className="text-sm font-semibold tracking-tight">
              MSS Feedback
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            {userName ? (
              <span className="hidden sm:inline text-xs font-medium">
                {userName}
              </span>
            ) : null}
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              aria-label="Profile"
            >
              {(userName ?? "?")[0]?.toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/80 bg-background/90 backdrop-blur-md dark:border-zinc-800/80">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {tabs.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition ${
                  active
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : ""
                  }`}
                >
                  <t.Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.8} />
                </span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="h-16" />
    </>
  );
}
