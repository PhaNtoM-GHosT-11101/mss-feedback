"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    `rounded-full px-3 py-1.5 text-xs font-medium transition ${
      active
        ? "bg-emerald-600 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }`;

  return (
    <div className="mx-auto max-w-3xl px-4">
      <NavBar />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Complaints</h1>
        <Link
          href="/complaints/new"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          + New
        </Link>
      </div>

      <input
        value={filters.q}
        onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        placeholder="Search complaints…"
        className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-800 dark:bg-gray-900"
      />

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

      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gray-500">
        <span>Sort:</span>
        {(["upvotes", "newest"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilters({ ...filters, sort: s })}
            className={filters.sort === s ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}
          >
            {s === "upvotes" ? "Most upvoted" : "Newest"}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {loading && <p className="py-8 text-center text-sm text-gray-400">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            No complaints match.
          </p>
        )}
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/complaints/${c.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-3.5 transition hover:border-emerald-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-800"
          >
            <div className="flex items-start gap-3">
              <div className="flex shrink-0 flex-col items-center rounded-lg bg-gray-50 px-2.5 py-1.5 dark:bg-gray-800">
                <span className="text-sm font-bold leading-tight">{c.upvote_count}</span>
                <span className="text-[10px] leading-none text-gray-400">▲</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {c.is_pinned && <span className="text-xs">📌</span>}
                  <p className="truncate text-sm font-medium">{c.title}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColor(c.status)}`}>
                    {statusLabel(c.status)}
                  </span>
                  {c.category?.name && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] dark:bg-gray-800">
                      {c.category.name}
                    </span>
                  )}
                  {c.complaint_author && <span className="truncate">{c.complaint_author}</span>}
                  <span>{timeAgo(c.created_at)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="h-4" />
    </div>
  );
}
