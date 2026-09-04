"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Institution } from "@/lib/institution";

export default function InstitutionPicker({
  institutions,
}: {
  institutions: Institution[];
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return institutions;
    return institutions.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        i.slug.toLowerCase().includes(term),
    );
  }, [q, institutions]);

  const groups: { label: string; items: Institution[] }[] = useMemo(() => {
    const map = new Map<string, Institution[]>();
    for (const i of institutions) {
      const k = i.kind ?? "Other";
      const arr = map.get(k) ?? [];
      arr.push(i);
      map.set(k, arr);
    }
    return [...map.entries()].map(([label, items]) => ({ label, items }));
  }, [institutions]);

  return (
    <div className="mx-auto min-h-svh max-w-2xl px-4 pb-16 pt-10">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#F0AE3C] to-[#E8A020] text-[#241A04]">
          <span className="font-display text-lg font-bold">M</span>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
          Campus Feedback
        </h1>
        <p className="mt-1.5 max-w-md text-sm text-muted">
          Pick your institution to rate meals, raise issues, and celebrate the
          mess that makes your day.
        </p>
      </div>

      <div className="mt-8">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your institute…"
            className="input !pl-10"
            autoFocus
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="card mt-6 border-dashed p-6 text-center text-sm text-muted">
          No institutes match “{q}”.
        </p>
      ) : (
        groups
          .filter((g) => g.items.some((i) => filtered.includes(i)))
          .map((g) => (
            <div key={g.label} className="mt-7">
              <p className="section-label mb-2">{g.label}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {g.items
                  .filter((i) => filtered.includes(i))
                  .map((i) => (
                    <Link
                      key={i.id}
                      href={`/${i.slug}`}
                      className="card card-hover flex items-center justify-between gap-3 p-3.5"
                    >
                      <span className="truncate text-sm font-medium">
                        {i.name}
                      </span>
                      <span className="text-xs text-muted">→</span>
                    </Link>
                  ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
