import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import NavBar from "@/components/NavBar";
import InstitutionPicker from "@/components/InstitutionPicker";
import { IconArrowUp, IconPlus, IconPin } from "@/components/icons";
import { timeAgo } from "@/lib/format";
import { headers } from "next/headers";
import { INST_HEADER } from "@/proxy";
import { getInstitutionBySlug, listInstitutions } from "@/lib/institution";
import type { Category } from "@/lib/types";

export const revalidate = 30;

type BoardComplaint = {
  id: string;
  title: string;
  description: string;
  upvote_count: number;
  created_at: string;
  is_pinned: boolean;
  is_anonymous: boolean;
  complaint_author: string | null;
  meal_session: string | null;
  category_id: string | null;
  category: { name: string } | null;
  photo_urls: string[] | null;
};

const MEAL_SESSION_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

const getBoard = unstable_cache(
  async (institutionId: string) => {
    const db = createAdminClient();
    const [cats, complaints] = await Promise.all([
      db
        .from("complaint_categories")
        .select("*")
        .eq("institution_id", institutionId)
        .eq("is_active", true)
        .order("sort_order"),
      db
        .from("complaints")
        .select(
          "id, title, description, status, upvote_count, created_at, is_pinned, is_anonymous, complaint_author, meal_session, category_id, category:complaint_categories(name), photo_urls",
        )
        .eq("institution_id", institutionId)
        .eq("is_flagged", false)
        .limit(500),
    ]);
    return {
      categories: ((cats?.data ?? []) as Category[]),
      complaints: (complaints?.data ?? []) as unknown as BoardComplaint[],
    };
  },
  ["home-board"],
  { revalidate: 30, tags: ["complaint"] },
);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const h = await headers();
  const hasSlug = !!h.get(INST_HEADER);
  if (!hasSlug) {
    const institutions = await listInstitutions();
    return <InstitutionPicker institutions={institutions} />;
  }
  const institution = hasSlug ? await getInstitutionBySlug(h.get(INST_HEADER)!) : null;
  if (!institution) {
    const institutions = await listInstitutions();
    return <InstitutionPicker institutions={institutions} />;
  }

  const { categories, complaints } = await getBoard(institution.id);

  const sort = sp.sort === "newest" ? "newest" : "upvotes";
  const category = sp.category ?? "all";

  const list = complaints
    .filter((c) => category === "all" || c.category_id === category)
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      if (sort === "newest") return b.created_at.localeCompare(a.created_at);
      return b.upvote_count - a.upvote_count;
    });

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar institutionName={institution.name} tagline={institution.tagline} />

      <div className="flex items-end justify-between pt-3">
        <div>
          <p className="section-label">Suggestion box</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
            Community board
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Complaints about {institution.name} — the most upvoted float up.
          </p>
        </div>
      </div>

      <Link
        href="/complaints/new"
        className="btn btn-primary mt-4 flex items-center justify-center gap-1.5 py-3"
      >
        <IconPlus className="h-4 w-4" /> File a complaint
      </Link>

      {/* Filters */}
      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/"
          scroll={false}
          className={`chip ${category === "all" ? "chip-active" : ""}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?category=${c.id}`}
            scroll={false}
            className={`chip ${category === c.id ? "chip-active" : ""}`}
          >
            {c.is_mess ? "🍽 " : ""}
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3 text-xs text-muted">
        <Link
          href="/"
          scroll={false}
          className={sort === "upvotes" ? "font-semibold text-[--accent-strong]" : "hover:text-foreground"}
        >
          Most upvoted
        </Link>
        <Link
          href="/?sort=newest"
          scroll={false}
          className={sort === "newest" ? "font-semibold text-[--accent-strong]" : "hover:text-foreground"}
        >
          Newest
        </Link>
      </div>

      {/* Board */}
      <div className="stagger mt-3 grid gap-2 sm:grid-cols-1">
        {list.length === 0 && (
          <p className="card border-dashed p-8 text-center text-sm text-muted">
            No complaints yet. Be the first to file one.
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
                <p className="text-sm font-medium leading-snug text-foreground">{c.title}</p>
              </div>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                {c.category?.name && (
                  <span className="rounded-md bg-[--accent-soft] px-1.5 py-0.5 font-medium text-[--accent-ink]">
                    {c.category.name}
                  </span>
                )}
                {c.meal_session && MEAL_SESSION_LABEL[c.meal_session] && (
                  <span className="rounded-md bg-[--surface-2] px-1.5 py-0.5">
                    {MEAL_SESSION_LABEL[c.meal_session]}
                  </span>
                )}
                <span>{timeAgo(c.created_at)}</span>
                {c.photo_urls && c.photo_urls.length > 0 && <span>📷</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="h-6" />
    </div>
  );
}