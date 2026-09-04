import { redirect } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import NavBar from "@/components/NavBar";
import RateMeal from "@/components/RateMeal";
import { IconComplaint, IconTrendingUp } from "@/components/icons";
import { todayISO, todayMenuItems, mealColor } from "@/lib/meal";
import { requireInstitution } from "@/lib/institution";
import type { Meal } from "@/lib/types";

export const dynamic = "force-dynamic";

const getShared = unstable_cache(
  async (today: string, dow: number, messId: string, institutionId: string) => {
    const db = createAdminClient();
    const [meals, menuRaw, ratingsToday, mealSettings] = await Promise.all([
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
        .from("ratings")
        .select("meal_id, stars")
        .eq("institution_id", institutionId)
        .eq("rating_date", today)
        .limit(5000),
      db
        .from("mess_meal_settings")
        .select("meal_id, is_active")
        .eq("institution_id", institutionId)
        .eq("mess_id", messId),
    ]);
    return { meals, menuRaw, ratingsToday, mealSettings };
  },
  ["mess-dashboard"],
  { revalidate: 60 },
);

export default async function MessPage() {
  const institution = await requireInstitution();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: myRatingsRaw }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, mess_id, is_banned")
      .eq("id", user.id)
      .single(),
    supabase.rpc("my_ratings"),
  ]);

  if (profile?.is_banned) {
    redirect("/");
  }

  const messId = profile?.mess_id ?? null;
  if (messId === null) redirect("/onboard");

  const myRatings = (myRatingsRaw ?? []).filter(
    (r: { rating_date: string }) => r.rating_date === todayISO(),
  );

  const today = todayISO();
  const dow = new Date().getUTCDay();

  const {
    meals,
    menuRaw,
    ratingsToday,
    mealSettings,
  } = await getShared(today, dow, messId, institution.id);

  const activeMealIds = new Set(
    (mealSettings.data ?? [])
      .filter((s: { is_active: boolean }) => s.is_active)
      .map((s: { meal_id: string }) => s.meal_id),
  );
  const messMeals = (meals.data ?? []).filter((m: Meal) => activeMealIds.has(m.id));

  const perMeal = new Map<string, { sum: number; count: number }>();
  for (const row of (ratingsToday.data ?? []) as { meal_id: string; stars: number }[]) {
    const cur = perMeal.get(row.meal_id) ?? { sum: 0, count: 0 };
    cur.sum += row.stars;
    cur.count += 1;
    perMeal.set(row.meal_id, cur);
  }
  const averages = new Map<string, { avg: number; count: number }>();
  for (const [mealId, { sum, count }] of perMeal) {
    averages.set(mealId, { avg: sum / count, count });
  }

  const menu = todayMenuItems(menuRaw.data ?? []);
  const menuByMeal = new Map<string, typeof menu>();
  for (const item of menu) {
    const list = menuByMeal.get(item.meal_id) ?? [];
    list.push(item);
    menuByMeal.set(item.meal_id, list);
  }

  const allAvg = [...averages.values()];
  const todayAvg = allAvg.length
    ? allAvg.reduce((s, a) => s + a.avg, 0) / allAvg.length
    : null;
  const ratedTotal = allAvg.reduce((s, a) => s + a.count, 0);
  const bestMeal = allAvg.length
    ? [...averages.entries()].sort((a, b) => b[1].avg - a[1].avg)[0]
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar userName={profile?.full_name} institutionName={institution.name} />

      <div className="pt-3">
        <p className="section-label">Mess &amp; menu</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
          Rate today&apos;s meals
        </h1>
      </div>

      {/* Mini stats strip */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="card card-hover p-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <IconTrendingUp className="h-3 w-3" /> Today avg
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {todayAvg !== null ? todayAvg.toFixed(1) : "—"}
            <span className="text-sm text-muted">/5</span>
          </p>
        </div>
        <div className="card card-hover p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Ratings</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{ratedTotal}</p>
        </div>
        <div className="card card-hover p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Top meal</p>
          <p className="mt-1 truncate font-display text-xl font-bold text-foreground">
            {bestMeal ? messMeals.find((m) => m.id === bestMeal[0])?.name ?? "—" : "—"}
          </p>
        </div>
      </div>

      <div className="mb-3 mt-6 flex items-baseline justify-between">
        <h2 className="section-label">Today&apos;s meals</h2>
        <span className="text-[11px] text-muted">{today}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {messMeals.map((meal: Meal) => {
          const my = myRatings.find((r: { meal_id: string }) => r.meal_id === meal.id);
          const avg = averages.get(meal.id);
          return (
            <RateMeal
              key={meal.id}
              meal={meal}
              messId={messId}
              ratedToday={my?.stars ?? null}
              avg={avg?.avg ?? null}
              count={avg?.count ?? 0}
            />
          );
        })}
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
        <Link href="/complaints/new" className="btn btn-primary flex flex-1 items-center justify-center gap-1.5">
          <IconComplaint className="h-4 w-4" /> Complain about mess
        </Link>
      </div>
    </div>
  );
}