import Link from "next/link";
import { unstable_cache } from "next/cache";
import NavBar from "@/components/NavBar";
import FilterBar from "./filters";
import { IconArrowUp, IconPin, IconPlus, IconComplaint } from "@/components/icons";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireInstitution } from "@/lib/institution";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import type { Category, Complaint } from "@/lib/types";

export const revalidate = 30;

const getCats = unstable_cache(
  async (institutionId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("complaint_categories")
      .select("*")
      .eq("institution_id", institutionId)
      .eq("is_active", true)
      .order("sort_order");
    return (data ?? []) as Category[];
  },
  ["complaint-categories"],
  { revalidate: 300 },
);

const getComplaints = unstable_cache(
  async (institutionId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("complaints")
      .select(
        "id, title, status, upvote_count, created_at, is_pinned, is_anonymous, complaint_author, complaint_author_roll, category_id, category:complaint_categories(name), mess_id, mess:messes(name)",
      )
      .eq("institution_id", institutionId)
      .eq("is_flagged", false)
      .limit(500);
    return (data ?? []) as unknown as Complaint[];
  },
  ["complaints-list"],
  { revalidate: 30, tags: ["complaint"] },
);

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const institution = await requireInstitution();
  const status = ["new", "in_progress", "resolved"].includes(sp.status ?? "")
    ? sp.status!
    : "all";
  const category = sp.category ?? "all";
  const q = (sp.q ?? "").slice(0, 80);
  const sort = sp.sort === "newest" ? "newest" : "upvotes";

  const [cats, complaints] = await Promise.all([
    getCats(institution.id),
    getComplaints(institution.id),
  ]);

  const list = complaints.filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    if (category !== "all" && c.category_id !== category) return false;
    if (q) {
      const text = (c.title + " " + c.description).toLowerCase();
      if (!text.includes(q.toLowerCase())) return false;
    }
    return true;
  });
  list.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    if (sort === "upvotes") return b.upvote_count - a.upvote_count;
    return b.created_at.localeCompare(a.created_at);
  });

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar institutionName={institution.name} tagline={institution.tagline} />

      <div className="flex items-center justify-between pt-2">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[--plum-soft] text-[--plum]">
            <IconComplaint className="h-5 w-5" />
          </span>
          Issues
        </h1>
        <Link href="/complaints/new" className="btn btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs">
          <IconPlus className="h-3.5 w-3.5" /> New
        </Link>
      </div>

      <FilterBar categories={cats} initial={{ status, category, q, sort }} />

      <div className="stagger mt-3 grid gap-2 sm:grid-cols-2">
        {list.length === 0 && (
          <p className="card border-dashed p-8 text-center text-sm text-muted sm:col-span-2">
            No complaints match.
          </p>
        )}
        {list.map((c) => (
          <Link
            key={c.id}
            href={`/complaints/${c.id}`}
            className="card card-hover group flex items-start gap-3 p-3.5"
          >
            <div className="flex shrink-0 flex-col items-center rounded-lg bg-[--surface-2] px-2.5 py-1.5">
              <span className="text-sm font-bold leading-tight">{c.upvote_count}</span>
              <IconArrowUp className="h-3 w-3 text-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {c.is_pinned && <IconPin className="h-3.5 w-3.5 shrink-0 text-[--accent]" />}
                <p className="truncate text-sm font-medium">{c.title}</p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className={statusColor(c.status)}>{statusLabel(c.status)}</span>
                {c.category?.name && (
                  <span className="rounded-full bg-[--surface-2] px-1.5 py-0.5 text-[10px]">
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