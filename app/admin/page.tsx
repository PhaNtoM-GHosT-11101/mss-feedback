import { unstable_cache } from "next/cache";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdmin } from "@/lib/admin-guard";
import { type Institution } from "@/lib/institution";
import CollegesManager from "./colleges";
import CategoriesPanel from "./categories";
import FlagsPanel, { type FlagGroup } from "./flags";
import { IconHome, IconShield } from "@/components/icons";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const getAdminData = unstable_cache(
  async () => {
    const db = createAdminClient();
    const [institutions, complaintCount, categoryCount] = await Promise.all([
      db.from("institutions").select("id, name, slug, kind, theme, tagline, is_active").order("name"),
      db.from("complaints").select("id", { count: "exact", head: true }),
      db.from("complaint_categories").select("id", { count: "exact", head: true }),
    ]);
    return {
      institutions: (institutions.data ?? []) as (Institution & { is_active: boolean })[],
      complaintCount: complaintCount.count ?? 0,
      categoryCount: categoryCount.count ?? 0,
    };
  },
  ["super-admin-data"],
  { revalidate: 60 },
);

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ college?: string }>;
}) {
  const g = await getSuperAdmin();
  const { institutions, complaintCount, categoryCount } = await getAdminData();

  const db = createAdminClient();
  const { data: flags } = await db
    .from("complaint_flags")
    .select(
      "complaint_id, created_at, complaint:complaints(id, title, is_flagged, institution:institutions(name, slug))",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const flagGroups: FlagGroup[] = [];
  const byId = new Map<string, FlagGroup>();
  for (const f of flags ?? []) {
    const c = f.complaint as unknown as
      | {
          id: string;
          title: string;
          is_flagged: boolean;
          institution: { name: string; slug: string }[] | null;
        }
      | null;
    if (!c) continue;
    const institution = Array.isArray(c.institution) ? c.institution[0] ?? null : c.institution ?? null;
    const existing = byId.get(c.id);
    if (existing) {
      existing.count += 1;
      if ((f.created_at ?? "") > (existing.latest ?? "")) existing.latest = f.created_at;
      continue;
    }
    const group: FlagGroup = {
      complaintId: c.id,
      title: c.title,
      institution,
      isFlagged: c.is_flagged,
      count: 1,
      latest: f.created_at ?? null,
    };
    byId.set(c.id, group);
    flagGroups.push(group);
  }

  const sp = await searchParams;
  const selected = institutions.find((i) => i.id === sp.college) ?? null;
  let categories: Category[] = [];
  if (selected) {
    const { data } = await db
      .from("complaint_categories")
      .select("*")
      .eq("institution_id", selected.id)
      .order("sort_order");
    categories = (data ?? []) as Category[];
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-[0_3px_12px_-3px_rgb(255_69_0/0.6)]">
              <IconShield className="h-4 w-4" strokeWidth={1.9} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="flex items-center gap-1.5 font-display text-[15px] font-bold tracking-tight">
                Super admin
                <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-accent-strong">
                  CREATOR
                </span>
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-muted">
                {g.profile?.full_name ?? "browsing without a session"}
              </span>
            </span>
          </span>
          <Link
            href="/"
            className="tap flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-surface2 hover:text-foreground"
          >
            <IconHome className="h-4 w-4" strokeWidth={1.9} />
            App
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Site control
          </h1>
          <p className="text-xs text-muted">
            {institutions.length} colleges · {complaintCount} complaints · {categoryCount} categories
          </p>
        </div>
        <p className="mt-1 text-xs text-muted">
          Only the person who built the app can change anything here.
          {!g.isCreator && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              read-only preview
            </span>
          )}
        </p>

        <div className="mt-5">
          <FlagsPanel groups={flagGroups} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <CollegesManager institutions={institutions} selectedId={selected?.id ?? null} />
          {selected && (
            <div>
              <CategoriesPanel
                institutionId={selected.id}
                institutionName={selected.name}
                institutionSlug={selected.slug}
                categories={categories}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}