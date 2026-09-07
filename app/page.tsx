import Link from "next/link";
import { headers } from "next/headers";
import { Inbox } from "lucide-react";
import { INST_HEADER } from "@/proxy";
import { getInstitutionBySlug, listInstitutions } from "@/lib/institution";
import { getCollegeBoard, getGlobalFeed, sortComplaints, type FeedSort } from "@/lib/feed";
import type { Institution } from "@/lib/institution";
import NavBar from "@/components/NavBar";
import CollegeSwitcher from "@/components/CollegeSwitcher";
import SortBar from "@/components/SortBar";
import FeedCard from "@/components/FeedCard";
import LiveFeed from "@/components/LiveFeed";
import { IconPlus } from "@/components/icons";

export const revalidate = 30;

function parseSort(value?: string): FeedSort {
  return value === "new" || value === "top" ? value : "hot";
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/* ============================ Trending scroller ============================ */

function TrendingBar({ institutions }: { institutions: Institution[] }) {
  if (institutions.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="section-label">Trending campuses</p>
      <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-1">
        {institutions.map((i) => (
          // Board switches use full-document <a> — board pages live behind a rewrite
          <a
            key={i.slug}
            href={`/${i.slug}`}
            className="tap group inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 transition hover:border-accent hover:bg-accent-soft"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-accent text-[9px] font-bold text-white">
              {initialsFor(i.name)}
            </span>
            <span className="text-[12.5px] font-medium text-muted group-hover:text-accent-ink">
              {i.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ============================ Feed section ============================ */

function FeedSection({
  list,
  sort,
  base,
  emptyHint,
}: {
  list: Awaited<ReturnType<typeof sortComplaints>>;
  sort: FeedSort;
  base: string;
  emptyHint: string;
}) {
  return (
    <div className="mt-1">
      <SortBar sort={sort} base={base} />
      <LiveFeed liveLabel={base === "/" ? "Live · all boards" : "Live"}>
        {list.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface2">
              <Inbox className="h-5 w-5 text-muted" />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">No complaints yet</p>
            <p className="mt-1 text-[13px] text-muted">{emptyHint}</p>
          </div>
        )}
        {list.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </LiveFeed>
    </div>
  );
}

/* ============================ Pages ============================ */

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
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-2 md:px-6">
        <header className="border-b border-border pb-5 pt-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">Suggestion box</p>
              <h1 className="mt-1.5 text-[26px] leading-tight font-bold tracking-tight">
                All boards
              </h1>
              <p className="mt-1 text-sm text-muted">
                Louder together — every campus&apos;s complaints in one stream. Post
                anonymously, upvote what matters.
              </p>
            </div>
            <div className="shrink-0">
              <CollegeSwitcher institutions={institutions} />
            </div>
          </div>
          <TrendingBar institutions={institutions} />
        </header>

        <FeedSection
          list={list}
          sort={sort}
          base="/"
          emptyHint="Campus life is quiet today. Be the first to file one."
        />
      </main>
    </div>
  );
}

async function CollegeBoardPage({
  institution,
  institutions,
  categoryParam,
  sortParam,
}: {
  institution: Institution;
  institutions: Institution[];
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
    <div>
      <NavBar institutionName={institution.name} tagline={institution.tagline} />
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-2 md:px-6">
        <header className="border-b border-border pb-5 pt-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">Suggestion box</p>
              <h1 className="mt-1.5 text-[26px] leading-tight font-bold tracking-tight">
                {institution.name}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {institution.tagline || "The most upvoted complaints float up first."}
              </p>
            </div>
            <CollegeSwitcher
              institutions={institutions}
              current={institution.slug}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={`/${institution.slug}/complaints/new`}
              className="btn btn-primary h-9 px-3.5 text-[13px]"
            >
              <IconPlus className="h-4 w-4" strokeWidth={2.4} />
              File a complaint
            </Link>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            {categories.map((c) => {
              const active = category === c.id;
              return (
                <Link
                  key={c.id}
                  href={active ? "." : `?category=${c.id}`}
                  scroll={false}
                  className={`chip ${active ? "chip-active" : ""}`}
                >
                  {c.is_mess ? "🍽 " : ""}
                  {c.name}
                </Link>
              );
            })}
          </div>
        </header>

        <FeedSection list={list} sort={sort} base={`/${institution.slug}`} emptyHint="No complaints in this segment yet. Be the first to speak up." />
      </main>
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
  const institutions = await listInstitutions();

  if (!slug) {
    return <GlobalFeedPage institutions={institutions} sortParam={sp.sort} />;
  }

  const institution = await getInstitutionBySlug(slug);
  if (!institution) {
    return <GlobalFeedPage institutions={institutions} sortParam={sp.sort} />;
  }

  return (
    <CollegeBoardPage
      institution={institution}
      institutions={institutions}
      categoryParam={sp.category}
      sortParam={sp.sort}
    />
  );
}