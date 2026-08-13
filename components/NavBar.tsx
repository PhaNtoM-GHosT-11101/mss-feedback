"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Megaphone, PartyPopper, User } from "lucide-react";
import { ThemeToggle } from "./theme-provider";

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
      <header className="sticky top-0 z-40 border-b border-[#EAD9B2]/60 bg-background/85 backdrop-blur-md dark:border-[#3A2E20]">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-b from-[#FF6B3D] to-[#EF5A2A] text-[10px] font-bold tracking-wide text-white shadow-[0_2px_8px_-2px_rgb(239_90_42/0.6)]">
              MSS
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight text-[#3B2A14] dark:text-[#F4E9DE]">
              MSS Feedback
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            {userName ? (
              <span className="hidden sm:inline text-xs font-medium">
                {userName}
              </span>
            ) : null}
            <ThemeToggle />
            <Link
              href="/profile"
              className="tap flex h-8 w-8 items-center justify-center rounded-full bg-[#F6E9CF] text-xs font-semibold text-[#5B4326] transition hover:bg-[#EAD9B2] dark:bg-[#2E241A] dark:text-[#E6D7C3] dark:hover:bg-[#3A2E20]"
              aria-label="Profile"
            >
              {(userName ?? "?")[0]?.toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAD9B2]/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-[#3A2E20]">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {tabs.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`tap flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition ${
                  active
                    ? "text-[#3B2A14] dark:text-[#F4E9DE]"
                    : "text-[#A0835C] hover:text-[#5B4326] dark:text-[#8C7A5F] dark:hover:text-[#D9C7A8]"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-[#EF5A2A] text-white"
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

      <div style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }} />
    </>
  );
}