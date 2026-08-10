"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, Pin, Plus, Search } from "lucide-react";
import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/client";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import type { Category, Complaint } from "@/lib/types";

type Filters = {
  category: string;
  status: string;
  q: string;
  sort: "upvotes" | "newest";
};

export default function ComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    status: "all",
    q: "",
    sort: "upvotes",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("complaint_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []));
    supabase
      .from("complaints")
      .select(
        "id, title, status, upvote_count, created_at, is_pinned, is_anonymous, complaint_author, complaint_author_roll, category_id, category:complaint_categories(name), mess_id, mess:messes(name)",
      )
      .limit(500)
      .then(({ data }) => {
        setComplaints((data ?? []) as unknown as Complaint[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = [...complaints];
    if (filters.category !== "all") {
      list = list.filter((c) => c.category_id === filters.category);
    }
    if (filters.status !== "all") {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters.q.trim()) {
      const q = filters.q.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      if (filters.sort === "upvotes") return b.upvote_count - a.upvote_count;
      return b.created_at.localeCompare(a.created_at);
    });
    return list;
  }, [complaints, filters]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
      active
        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
        : "border-zinc-200 bg-transparent text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
    }`;

  return (
    <div className="mx-auto max-w-lg px-4">
      <NavBar />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Complaints</h1>
        <Link href="/complaints/new" className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs">
          <Plus className="h-3.5 w-3.5" /> New
        </Link>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="Search complaints…"
          className="input pl-9"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button className={chip(filters.status === "all")} onClick={() => setFilters({ ...filters, status: "all" })}>
          All
        </button>
        {["new", "in_progress", "resolved"].map((s) => (
          <button key={s} className={chip(filters.status === s)} onClick={() => setFilters({ ...filters, status: s })}>
            {statusLabel(s)}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        <button className={chip(filters.category === "all")} onClick={() => setFilters({ ...filters, category: "all" })}>
          All categories
        </button>
        {categories.map((c) => (
          <button key={c.id} className={chip(filters.category === c.id)} onClick={() => setFilters({ ...filters, category: c.id })}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-3 text-xs text-zinc-500">
        <span className="section-label">Sort</span>
        {(["upvotes", "newest"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilters({ ...filters, sort: s })}
            className={
              filters.sort === s
                ? "font-semibold text-zinc-900 dark:text-white"
                : "hover:text-zinc-700 dark:hover:text-zinc-300"
            }
          >
            {s === "upvotes" ? "Most upvoted" : "Newest"}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {loading && <p className="py-8 text-center text-sm text-zinc-400">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p className="card border-dashed p-8 text-center text-sm text-zinc-400">
            No complaints match.
          </p>
        )}
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/complaints/${c.id}`}
            className="card card-hover group flex items-start gap-3 p-3.5"
          >
            <div className="flex shrink-0 flex-col items-center rounded-lg bg-zinc-50 px-2.5 py-1.5 dark:bg-zinc-900">
              <span className="text-sm font-bold leading-tight">{c.upvote_count}</span>
              <ArrowUp className="h-3 w-3 text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {c.is_pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                <p className="truncate text-sm font-medium">{c.title}</p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColor(c.status)}`}>
                  {statusLabel(c.status)}
                </span>
                {c.category?.name && (
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">
                    {c.category.name}
                  </span>
                )}
                {c.complaint_author && <span className="truncate">{c.complaint_author}</span>}
                <span>{timeAgo(c.created_at)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="h-4" />
    </div>
  );
}
