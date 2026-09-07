"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Institution } from "@/lib/institution";
import { IconArrowUp } from "@/components/icons";

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function CollegeSwitcher({
  institutions,
  current,
  label = "Go to a college",
}: {
  institutions: Institution[];
  current?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const activeBoard = institutions.find((i) => i.slug === current);
  const triggerLabel = activeBoard ? activeBoard.name : "All boards";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const menuItems = [
    {
      slug: null as string | null,
      name: "All boards",
      match: "all boards" === q,
    },
    ...institutions
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .map((i) => ({ slug: i.slug, name: i.name, match: true })),
  ].filter((i) => i.match || q === "");

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
        className="tap inline-flex h-9 max-w-[240px] items-center gap-2 rounded-full border border-border bg-surface py-0 pl-3.5 pr-2.5 text-sm font-medium text-foreground outline-none transition hover:border-zinc-400 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
      >
        <span className="min-w-0 truncate">
          {label}: <span className={activeBoard ? "font-bold" : ""}>{triggerLabel}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 dark:text-zinc-500 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="card anim-scale-in absolute right-0 z-50 mt-2 w-72 origin-top-right overflow-hidden p-1.5 shadow-xl shadow-black/10">
          <div className="mb-1 p-1">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search colleges…"
              className="input h-8 py-0 pl-3 pr-3 text-[13px]"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {menuItems.map((item) => {
              const active = item.slug ? item.slug === current : !current;
              const href = item.slug ? `/${item.slug}` : "/";
              return (
                <a
                  key={item.slug ?? "all"}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`tap flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition ${
                    active
                      ? "bg-accent-soft text-accent-ink"
                      : "text-zinc-700 hover:bg-surface2 dark:text-zinc-200"
                  }`}
                >
                  {item.slug ? (
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                        active ? "bg-accent text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {initialsFor(item.name)}
                    </span>
                  ) : (
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                        active ? "bg-accent" : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    >
                      <IconArrowUp className="h-3.5 w-3.5 text-white" strokeWidth={2.6} />
                    </span>
                  )}
                  <span className="min-w-0 truncate">{item.name}</span>
                  {active && <Check className="ml-auto h-4 w-4 shrink-0 text-accent-strong" />}
                </a>
              );
            })}
            {menuItems.length === 0 && (
              <p className="px-2.5 py-3 text-center text-[12.5px] text-muted">
                No colleges found
              </p>
            )}
          </div>
          <div className="mt-1 border-t border-border/70 pt-1.5 text-center text-[10.5px] font-medium text-muted">
            {institutions.length} college boards
          </div>
        </div>
      )}
    </div>
  );
}