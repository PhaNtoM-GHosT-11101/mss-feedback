import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, Info } from "lucide-react";
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

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/* ============================ Right rail ============================ */

function AboutCard({ about, points }: { about: string; points: string[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface2/60 px-4 py-2.5">
        <Info className="h-3.5 w-3.5 text-accent" />
        <h2 className="text-[13px] font-bold tracking-tight">About Campus Feedback</h2>
      </div>
      <div className="px-4 py-3">
        <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">{about}</p>
        <ul className="mt-3 space-y-1.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[12.5px] text-zinc-600 dark:text-zinc-300">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TopBoardsCard({ institutions, total }: { institutions: Institution[]; total: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-surface2/60 px-4 py-2.5">
        <h2 className="text-[13px] font-bold tracking-tight">Top boards</h2>
      </div>
      <ul className="divide-y divide-border/70">
        {institutions.slice(0, 12).map((i) => (
          <li key={i.id}>
            <Link
              href={`/${i.slug}`}
              className="tap group flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-zinc-700 transition hover:bg-surface2 dark:text-zinc-200"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[10px] font-bold text-accent-ink">
                {initialsFor(i.name)}
              </span>
              <span className="min-w-0 truncate">{i.name}</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-300 transition group-hover:text-accent dark:text-zinc-600" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-border bg-surface2/40 px-4 py-2 text-center text-[11px] font-medium text-muted">
        {total} boards · {institutions.length} colleges
      </div>
    </div>
  );
}

function AboutBoardCard({
  institution,
  complaintCount,
}: {
  institution: Institution;
  complaintCount: number;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent font-bold text-white">
          {initialsFor(institution.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-bold tracking-tight">{institution.name}</h2>
          <p className="truncate text-[11.5px] text-muted">
            {complaintCount} open suggestion{complaintCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      {institution.tagline && (
        <p className="px-4 pb-2 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-300">
          {institution.tagline}
        </p>
      )}
      <div className="border-t border-border px-4 py-3">
        <Link
          href={`/${institution.slug}/complaints/new`}
          className="btn btn-primary flex w-full items-center justify-center gap-1.5"
        >
          <IconPlus className="h-4 w-4" /> File a complaint
        </Link>
      </div>
    </div>
  );
}

function SegmentsCard({ categories, active }: { categories: Category[]; active: string }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-surface2/60 px-4 py-2.5">
        <h2 className="text-[13px] font-bold tracking-tight">Segments</h2>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 py-3">
        <Link href="." scroll={false} className={`chip ${active === "all" ? "chip-active" : ""}`}>
          All
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`?category=${c.id}`} scroll={false} className={`chip ${active === c.id ? "chip-active" : ""}`}>
            {c.is_mess ? "🍽 " : ""}
            {c.name}
          </Link>
        ))}
      </div>
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
    <div className="md:ml-60">
      <NavBar />

      <main className="mx-auto flex max-w-[1024px] items-start gap-6 px-4 pb-10 pt-4 md:px-6">
        <section className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-label">Suggestion box</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">All boards</h1>
              <p className="mt-0.5 text-sm text-muted">
                Every college&apos;s complaints, one feed. Pick a college below to file your own.
              </p>
            </div>
            <div className="text-right">
              <CollegeSwitcher institutions={institutions} />
            </div>
          </div>

          <div className="mt-5">
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
        </section>

        <aside className="hidden w-72 shrink-0 flex-col gap-4 xl:flex">
          <AboutCard
            about="Every college runs its own public suggestion box. Complaints are open for anyone to read — upvotes decide what gets heard."
            points={[
              "Open boards — no login needed to read",
              "Post anonymously or under your name",
              "Upvotes surface what matters most",
            ]}
          />
          <TopBoardsCard institutions={institutions} total={institutions.length} />
        </aside>
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
    <div className="md:ml-60">
      <NavBar institutionName={institution.name} tagline={institution.tagline} />

      <main className="mx-auto flex max-w-[1024px] items-start gap-6 px-4 pb-10 pt-4 md:px-6">
        <section className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-label">Suggestion box</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">{institution.name}</h1>
              <p className="mt-0.5 text-sm text-muted">
                Complaints about {institution.name} — the most upvoted float up.
              </p>
            </div>
            <div className="text-right">
              <CollegeSwitcher institutions={institutions} current={institution.slug} />
            </div>
          </div>

          <div className="mt-5">
            <SortBar sort={sort} base={`/${institution.slug}`} />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:hidden">
            <Link href="." scroll={false} className={`chip ${category === "all" ? "chip-active" : ""}`}>
              All
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={`?category=${c.id}`} scroll={false} className={`chip ${category === c.id ? "chip-active" : ""}`}>
                {c.is_mess ? "🍽 " : ""}
                {c.name}
              </Link>
            ))}
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
        </section>

        <aside className="hidden w-72 shrink-0 flex-col gap-4 xl:flex">
          <AboutBoardCard institution={institution} complaintCount={complaints.length} />
          <SegmentsCard categories={categories} active={category} />
        </aside>
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