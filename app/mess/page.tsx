import { redirect } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import NavBar from "@/components/NavBar";
import { IconArrowUp, IconComplaint, IconPlus, IconPin, IconTrendingUp } from "@/components/icons";
import { todayISO, todayMenuItems, mealColor } from "@/lib/meal";
import { requireInstitution } from "@/lib/institution";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import { AUTH_BYPASS_ENABLED } from "@/lib/testing";
import type { Category, Meal } from "@/lib/types";

export const dynamic = "force-dynamic";

type MessComplaint = {
  id: string;
  title: string;
  status: string;
  upvote_count: number;
  created_at: string;
  is_pinned: boolean;
  meal_session: string | null;
  category: { name: string } | null;
};

const getMenu = unstable_cache(
  async (today: string, dow: number, messId: string, institutionId: string) => {
    const db = createAdminClient();
    const [meals, menuRaw, mealSettings] = await Promise.all([
      db
        .from("meals")
        .select("*")
        .eq("institution_id", institutionId)
        .eq("is_active", true)
        .order("sort_order"),
      db
        .from("menu_items")
        .select("*")
        .eq("institution_id", institutionId)
        .or(`menu_date.eq.${today},and(is_template.eq.true,weekday.eq.${dow})`)
        .or(`mess_id.eq.${messId},mess_id.is.null`)
        .limit(50),
      db
        .from("mess_meal_settings")
        .select("meal_id, is_active")
        .eq("institution_id", institutionId)
        .eq("mess_id", messId),
    ]);
    return { meals, menuRaw, mealSettings };
  },
  ["mess-menu"],
  { revalidate: 60 },
);

const getMessComplaints = unstable_cache(
  async (institutionId: string, categoryIds: string[]) => {
    if (categoryIds.length === 0) return [];
    const db = createAdminClient();
    const { data } = await db
      .from("complaints")
      .select(
        "id, title, status, upvote_count, created_at, is_pinned, meal_session, category:complaint_categories(name)",
      )
      .eq("institution_id", institutionId)
      .eq("is_flagged", false)
      .in("category_id", categoryIds)
      .limit(300);
    return (data ?? []) as unknown as MessComplaint[];
  },
  ["mess-complaints"],
  { revalidate: 30, tags: ["complaint"] },
);

const MEAL_SESSION_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

export default async function MessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const institution = await requireInstitution();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !AUTH_BYPASS_ENABLED) redirect("/login");

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("id, full_name, mess_id, is_banned")
        .eq("id", user.id)
        .single()
    : { data: null };

  if (profile?.is_banned) {
    redirect("/");
  }

  // Mess categories for this college.
  const dbCats = createAdminClient();
  const { data: cats } = await dbCats
    .from("complaint_categories")
    .select("id, name, sort_order")
    .eq("institution_id", institution.id)
    .eq("is_active", true)
    .eq("is_mess", true)
    .order("sort_order");
  const messCats = (cats ?? []) as Pick<Category, "id" | "name" | "sort_order">[];
  const messCatIds = messCats.map((c) => c.id);

  // Which mess to show the menu for.
  let messId = profile?.mess_id ?? null;
  if (messId === null && !AUTH_BYPASS_ENABLED) redirect("/onboard");
  if (messId === null) {
    const { data: messRow } = await createAdminClient()
      .from("messes")
      .select("id")
      .eq("institution_id", institution.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    messId = messRow?.id ?? null;
  }
  if (messId === null) redirect("/");

  const [complaints, menuData] = await Promise.all([
    getMessComplaints(institution.id, messCatIds),
    getMenu(todayISO(), new Date().getUTCDay(), messId, institution.id),
  ]);

  const status = ["new", "in_progress", "resolved"].includes(sp.status ?? "")
    ? sp.status!
    : "all";

  const list = complaints
    .filter((c) => status === "all" || c.status === status)
    .sort(
      (a, b) =>
        Number(b.is_pinned) - Number(a.is_pinned) ||
        b.upvote_count - a.upvote_count,
    );

  const open = complaints.filter((c) => c.status === "new" || c.status === "in_progress");
  const resolvedCount = complaints.filter((c) => c.status === "resolved");
  const total = complaints.length;
  const resolveRate =
    total > 0 ? Math.round((resolvedCount.length / total) * 100) : null;

  const { meals, menuRaw, mealSettings } = menuData;
  const activeMealIds = new Set(
    (mealSettings.data ?? [])
      .filter((s: { is_active: boolean }) => s.is_active)
      .map((s: { meal_id: string }) => s.meal_id),
  );
  const messMeals = (meals.data ?? []).filter((m: Meal) => activeMealIds.has(m.id));
  const menu = todayMenuItems(menuRaw.data ?? []);
  const menuByMeal = new Map<string, typeof menu>();
  for (const item of menu) {
    const l = menuByMeal.get(item.meal_id) ?? [];
    l.push(item);
    menuByMeal.set(item.meal_id, l);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar userName={profile?.full_name} institutionName={institution.name} tagline={institution.tagline} />

      <div className="pt-3">
        <p className="section-label">Mess &amp; menu</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Mess complaints</h1>
        <p className="mt-0.5 text-sm text-muted">
          Report mess problems — the committee reviews and resolves them.
        </p>
      </div>

      <Link
        href="/complaints/new?mess=1"
        className="btn btn-primary mt-4 flex items-center justify-center gap-1.5 py-3"
      >
        <IconPlus className="h-4 w-4" /> Report a mess problem
      </Link>

      {/* Stats strip */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="card card-hover p-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <IconTrendingUp className="h-3 w-3" /> Open
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{open.length}</p>
        </div>
        <div className="card card-hover p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Resolved</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{resolvedCount.length}</p>
        </div>
        <div className="card card-hover p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Resolve rate</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {resolveRate !== null ? `${resolveRate}%` : "—"}
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/mess"
          className={`chip ${status === "all" ? "chip-active" : ""}`}
          scroll={false}
        >
          All
        </Link>
        {(["new", "in_progress", "resolved"] as const).map((s) => (
          <Link
            key={s}
            href={`/mess?status=${s}`}
            className={`chip ${status === s ? "chip-active" : ""}`}
            scroll={false}
          >
            {statusLabel(s)}
          </Link>
        ))}
      </div>

      {/* Complaint list */}
      <div className="stagger mt-3 grid gap-2 sm:grid-cols-2">
        {list.length === 0 && (
          <p className="card border-dashed p-8 text-center text-sm text-muted sm:col-span-2">
            No {status === "all" ? "mess complaints" : `${statusLabel(status)} mess complaints`} yet.
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
              </div>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="section-label mb-3 mt-8">Today&apos;s menu</h2>
      <div className="card p-4">
        {messMeals.map((meal: Meal, i: number) => {
          const items = menuByMeal.get(meal.id) ?? [];
          const c = mealColor(meal);
          return (
            <div key={meal.id} className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-border" : "pt-0"}`}>
              <span className={`h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <span className="font-display text-sm font-semibold">{meal.name}</span>
                {items.length > 0 ? (
                  <span className="truncate text-right text-sm text-muted">
                    {items.map((it) => it.item_text).join(", ")}
                  </span>
                ) : (
                  <span className="text-xs text-muted/60">not posted</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/complaints"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <IconComplaint className="h-4 w-4" /> All issues board
        </Link>
      </div>
    </div>
  );
}