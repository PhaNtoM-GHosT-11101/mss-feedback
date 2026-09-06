"use client";

import { useRouter } from "next/navigation";
import type { Institution } from "@/lib/institution";

export default function CollegeSwitcher({
  institutions,
  current,
  label = "Go to a college",
}: {
  institutions: Institution[];
  current?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={current ?? "all"}
        onChange={(e) => {
          const v = e.target.value;
          router.push(v === "all" ? "/" : `/${v}`);
        }}
        aria-label="Go to a college board"
        className="max-w-[220px] cursor-pointer rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground outline-none transition hover:border-zinc-400 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:hover:border-zinc-500"
      >
        <option value="all">All boards</option>
        {institutions.map((i) => (
          <option key={i.id} value={i.slug}>
            {i.name}
          </option>
        ))}
      </select>
    </label>
  );
}