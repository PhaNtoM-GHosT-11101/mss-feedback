import Link from "next/link";
import { headers } from "next/headers";
import { INST_HEADER } from "@/proxy";
import { getInstitutionBySlug, listInstitutions } from "@/lib/institution";
import { getCollegeBoard, getGlobalFeed, sortComplaints, type FeedSort } from "@/lib/feed";
import type { Institution } from "@/lib/institution";
import NavBar from "@/components/NavBar";
import CollegeSwitcher from "@/components/CollegeSwitcher";
import SortBar from "@/components/SortBar";
import FeedCard from "@/components/FeedCard";
import { IconPlus } from "@/components/icons";
import type { Category } from "@/lib/types";

export const revalidate = 30;

function parseSort(value?: string): FeedSort {
  return value === "new" || value === "top" ? value : "hot";
}

function Filters({ category, categories }: { category: string; categories: Category[] }) {
  return (
    <div className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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
  );
}

async function GlobalFeedPage({
  institutions,
  sortParam,
}: {
  institutions: Institution[];
  sortParam?: string;
}) {
  const items = await getGlobalFeed();
  const sort = parseSort(sortParam);
  const list = sortComplaints(items, sort);

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar />

      <div className="flex flex-wrap items-end justify-between gap-3 pt-3">
        <div>
          <p className="section-label">Suggestion box</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
            All boards
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Every college&apos;s complaints, one feed. Pick a college below to file
            your own.
          </p>
        </div>
        <div className="text-right">
          <CollegeSwitcher institutions={institutions} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <SortBar sort={sort} base="/" />
      </div>

      <div className="stagger mt-3 grid gap-2">
        {list.length === 0 && (
          <p className="card border-dashed p-8 text-center text-sm text-muted">
            No complaints yet. Visit a college and be the first to post.
          </p>
        )}
        {list.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
      <div className="h-6" />
    </div>
  );
}

async function CollegeBoardPage({
  institution,
  categoryParam,
  sortParam,
}: {
  institution: Institution;
  categoryParam?: string;
  sortParam?: string;
}) {
  const { categories, complaints } = await getCollegeBoard(institution.id);
  const sort = parseSort(sortParam);
  const category = categoryParam ?? "all";

  const list = sortComplaints(
    complaints.filter((c) => category === "all" || c.category_id === category),
    sort,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar institutionName={institution.name} tagline={institution.tagline} />

      <div className="flex flex-wrap items-end justify-between gap-3 pt-3">
        <div>
          <p className="section-label">Suggestion box</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
            {institution.name}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Complaints about {institution.name} — the most upvoted float up.
          </p>
        </div>
        <div className="text-right">
          <CollegeSwitcher institutions={await listInstitutions()} current={institution.slug} />
        </div>
      </div>

      <Link
        href={`/${institution.slug}/complaints/new`}
        className="btn btn-primary mt-4 flex items-center justify-center gap-1.5 py-3"
      >
        <IconPlus className="h-4 w-4" /> File a complaint
      </Link>

      <Filters category={category} categories={categories} />

      <div className="mt-3 flex items-center justify-end">
        <SortBar sort={sort} base={`/${institution.slug}`} />
      </div>

      <div className="stagger mt-3 grid gap-2">
        {list.length === 0 && (
          <p className="card border-dashed p-8 text-center text-sm text-muted">
            No complaints yet. Be the first to file one.
          </p>
        )}
        {list.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
      <div className="h-6" />
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const h = await headers();
  const slug = h.get(INST_HEADER);

  if (!slug) {
    return <GlobalFeedPage institutions={await listInstitutions()} sortParam={sp.sort} />;
  }

  const institution = await getInstitutionBySlug(slug);
  if (!institution) {
    return <GlobalFeedPage institutions={await listInstitutions()} sortParam={sp.sort} />;
  }

  return (
    <CollegeBoardPage
      institution={institution}
      categoryParam={sp.category}
      sortParam={sp.sort}
    />
  );
}