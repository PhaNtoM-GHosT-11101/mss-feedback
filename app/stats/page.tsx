import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import { IconTrendingUp, IconTrendingDown, IconFlame, IconStats } from "@/components/icons";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { Donut } from "@/components/charts/Donut";
import { HBars } from "@/components/charts/HBars";
import { Sparkline } from "@/components/charts/Sparkline";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayISO } from "@/lib/meal";
import type { Meal } from "@/lib/types";

export const dynamic = "force-dynamic";

function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function avgOf(list: number[]): number | null {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
}

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, mess_id, mess:messes(name)")
    .eq("id", user.id)
    .single() as unknown as { data: { full_name: string | null; mess_id: string | null; mess: { name: string } | null } | null };

  const messId = profile?.mess_id ?? null;

  const [{ data: mealsRaw }, { data: ratings30 }, { data: complaints }, { data: mealSettings }] =
    await Promise.all([
      createAdminClient().from("meals").select("id, name, start_hour, end_hour, sort_order, is_active").eq("is_active", true).order("sort_order") as unknown as { data: Meal[] | null },
      createAdminClient()
        .from("ratings")
        .select("meal_id, stars, rating_date")
        .gte("rating_date", lastNDays(30)[0])
        .limit(10000),
      createAdminClient()
        .from("complaints")
        .select("status, created_at, updated_at, mess_id")
        .eq("is_flagged", false)
        .limit(5000),
      createAdminClient()
        .from("mess_meal_settings")
        .select("meal_id, is_active")
        .eq("mess_id", messId ?? "") as unknown as { data: { meal_id: string; is_active: boolean }[] | null },
    ]);
  const meals = ((mealsRaw ?? []) as Meal[]).filter((m) =>
    messId
      ? (mealSettings ?? []).find((s) => s.meal_id === m.id)?.is_active !== false
      : true,
  );
  const ratings = (ratings30 ?? []) as { meal_id: string; stars: number; rating_date: string }[];
  const myComplaints = ((complaints ?? []) as { status: string; created_at: string; updated_at: string; mess_id: string | null }[]).filter(
    (c) => !messId || c.mess_id === messId || c.mess_id === null,
  );

  const today = todayISO();
  const days7 = lastNDays(7).slice(-7);
  const days30 = lastNDays(30);

  const todayRatings = ratings.filter((r) => r.rating_date === today);
  const weekRatings = ratings.filter((r) => r.rating_date >= days7[0]);
  const monthByMeal = new Map<string, number[]>();
  for (const r of ratings) {
    const arr = monthByMeal.get(r.meal_id) ?? [];
    arr.push(r.stars);
    monthByMeal.set(r.meal_id, arr);
  }

  const todayAvg = avgOf(todayRatings.map((r) => r.stars));
  const weekAvg = avgOf(weekRatings.map((r) => r.stars));
  const monthAvg = avgOf(ratings.map((r) => r.stars));

  const mealAvg30 = [...monthByMeal.entries()]
    .map(([id, stars]) => ({
      id,
      name: meals.find((m) => m.id === id)?.name ?? "Meal",
      avg: stars.reduce((a, b) => a + b, 0) / stars.length,
      count: stars.length,
    }))
    .sort((a, b) => b.avg - a.avg);

  const best = mealAvg30[0] ?? null;
  const worst = mealAvg30.length > 1 ? mealAvg30[mealAvg30.length - 1] : null;

  // per-day averages for trend chart
  const trend = days30.map((day) => {
    const dayRatings = ratings.filter((r) => r.rating_date === day);
    const mealsOnDay = new Map<string, number[]>();
    for (const r of dayRatings) {
      const arr = mealsOnDay.get(r.meal_id) ?? [];
      arr.push(r.stars);
      mealsOnDay.set(r.meal_id, arr);
    }
    const label = new Date(day + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    const mealsMap: Record<string, number> = {};
    for (const [id, arr] of mealsOnDay) {
      mealsMap[id] = arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    return {
      label,
      overall: dayRatings.length ? avgOf(dayRatings.map((r) => r.stars)) : null,
      meals: mealsMap,
    };
  });

  // complaint stats
  const open = myComplaints.filter((c) => c.status !== "resolved").length;
  const resolved = myComplaints.filter((c) => c.status === "resolved").length;
  const resolutionHours = myComplaints
    .filter((c) => c.status === "resolved")
    .map((c) => (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / 3.6e6)
    .filter((h) => h >= 0);
  const avgResHours = resolutionHours.length
    ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length
    : null;

  // my ratings history (7d sparkline)
  const myRatingsRaw = await supabase.rpc("my_ratings");
  const myRatings = (myRatingsRaw.data ?? []) as { stars: number; rating_date: string; meal_id: string }[];
  const myWeek = days7.map((day) => {
    const arr = myRatings.filter((r) => r.rating_date === day);
    return {
      label: new Date(day + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" }),
      value: arr.length ? avgOf(arr.map((r) => r.stars)) ?? 0 : null,
    };
  });

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar />

      <div className="pt-2">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[--accent-soft] text-[--accent-strong]">
            <IconStats className="h-5 w-5" />
          </span>
          Stats
        </h1>
        <p className="mt-1 text-xs text-muted">
          {profile?.mess?.name ? `${profile.mess.name} mess` : "Your mess"} · last 30 days
        </p>
      </div>

      {/* KPI strip */}
      <div className="stagger mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Today avg</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {todayAvg !== null ? todayAvg.toFixed(1) : "—"}
            <span className="text-sm text-muted">/5</span>
          </p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">7d avg</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {weekAvg !== null ? weekAvg.toFixed(1) : "—"}
            <span className="text-sm text-muted">/5</span>
          </p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">30d avg</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {monthAvg !== null ? monthAvg.toFixed(1) : "—"}
            <span className="text-sm text-muted">/5</span>
          </p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Ratings</p>
          <p className="mt-1 font-display text-2xl font-bold">{ratings.length}</p>
        </div>
      </div>

      {/* Meal comparison */}
      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="section-label">Meal comparison</h2>
        <span className="text-[11px] text-muted">avg last 30 days</span>
      </div>
      <div className="card mt-3 p-4">
        {mealAvg30.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No ratings yet — rate a meal to feed the charts.</p>
        ) : (
          <HBars
            items={mealAvg30.map((m, i) => ({
              label: m.name,
              value: Math.round(m.avg * 10) / 10,
              color: `var(--chart-${((i % 4) + 1)})`,
            }))}
          />
        )}
      </div>

      {/* Highlights */}
      {(best || worst) && (
        <div className="stagger mt-4 grid grid-cols-2 gap-2">
          {best && (
            <div className="card border-[--sage]/25 bg-[--sage-soft]/50 p-3">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[--sage]">
                <IconTrendingUp className="h-3 w-3" /> Best meal
              </p>
              <p className="mt-1 truncate font-display text-lg font-bold">{best.name}</p>
              <p className="text-xs text-muted">
                {best.avg.toFixed(1)}★ · {best.count} ratings
              </p>
            </div>
          )}
          {worst && (
            <div className="card border-[--meal-lunch]/25 bg-[--meal-lunch-soft]/50 p-3">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#C4503B] dark:text-[#E5765F]">
                <IconTrendingDown className="h-3 w-3" /> Needs love
              </p>
              <p className="mt-1 truncate font-display text-lg font-bold">{worst.name}</p>
              <p className="text-xs text-muted">
                {worst.avg.toFixed(1)}★ · {worst.count} ratings
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trend */}
      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="section-label">Trend</h2>
        <span className="text-[11px] text-muted">avg per day</span>
      </div>
      <div className="card mt-3 p-4">
        <AreaTrend
          data={trend}
          mealNames={mealAvg30.map((m) => m.name)}
          height={200}
        />
      </div>

      {/* Complaints pulse */}
      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="section-label">Issue pulse</h2>
        <span className="text-[11px] text-muted">all-time</span>
      </div>
      <div className="card mt-3 p-4">
        <div className="flex items-center gap-5">
          <Donut
            segments={[
              { label: "Resolved", value: resolved, color: "var(--chart-2)" },
              { label: "Open", value: open, color: "var(--chart-1)" },
            ]}
            centerLabel="issues"
            centerValue={String(open + resolved)}
          />
          <div className="text-sm">
            <p className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--chart-2)" }} />
              <span className="text-muted">Resolved</span>
              <span className="ml-auto font-bold">{resolved}</span>
            </p>
            <p className="mt-1.5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--chart-1)" }} />
              <span className="text-muted">Open</span>
              <span className="ml-auto font-bold">{open}</span>
            </p>
            <p className="mt-3 text-xs text-muted">
              {avgResHours !== null
                ? `Avg resolution: ${avgResHours < 24 ? `${Math.round(avgResHours)}h` : `${(avgResHours / 24).toFixed(1)}d`}`
                : "No resolved issues yet"}
            </p>
          </div>
        </div>
      </div>

      {/* My week */}
      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="section-label">My last 7 days</h2>
        <span className="flex items-center gap-1 text-[11px] text-muted">
          <IconFlame className="h-3 w-3 text-[--accent]" /> {myRatings.length} total ratings
        </span>
      </div>
      <div className="card mt-3 p-4">
        <Sparkline data={myWeek} height={44} stroke="var(--chart-1)" />
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          {myWeek.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
        {myWeek.every((v) => v.value === null) && (
          <p className="py-4 text-center text-sm text-muted">Rate meals daily to grow your streak 🔥</p>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}
