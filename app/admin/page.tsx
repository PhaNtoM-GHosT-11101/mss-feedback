import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { todayISO } from "@/lib/meal";
import { deletePraise } from "./actions";
import { Donut } from "@/components/charts/Donut";
import { Sparkline } from "@/components/charts/Sparkline";
import { ActivityBars } from "@/components/charts/ActivityBars";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { HBars } from "@/components/charts/HBars";
import { IconTrendingUp, IconTrendingDown, IconStats, IconNote } from "@/components/icons";
import Link from "next/link";

export const dynamic = "force-dynamic";

function pct(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return ((a - b) / b) * 100;
}

function Delta({ v, invert = false }: { v: number | null; invert?: boolean }) {
  if (v === null) return <span className="text-[10px] text-muted">—</span>;
  const good = invert ? v < 0 : v > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-[11px] font-bold ${good ? "text-[--sage]" : "text-[#C4503B] dark:text-[#E5765F]"}`}
    >
      {v > 0 ? <IconTrendingUp className="h-3 w-3" /> : v < 0 ? <IconTrendingDown className="h-3 w-3" /> : null}
      {v > 0 ? "+" : ""}
      {v.toFixed(1)}%
    </span>
  );
}

export default async function AdminDashboard() {
  const { messIds, institution } = await getCommittee();
  const db = createAdminClient();
  const today = todayISO();
  const scope = <T,>(q: T): T => {
    const anyQ = q as unknown as { eq: (c: string, v: unknown) => void; in: (c: string, vals: string[]) => void };
    anyQ.eq("institution_id", institution.id);
    if (messIds?.length) anyQ.in("mess_id", messIds);
    return q;
  };

  const since14 = new Date();
  since14.setDate(since14.getDate() - 13);
  const since14ISO = since14.toISOString();
  const weekAgoISO = new Date(since14.getTime() + 6 * 864e5).toISOString().slice(0, 10);
  const prevWeekISO = new Date(since14.getTime() - 7 * 864e5).toISOString().slice(0, 10);

  const [
    complaints,
    ratingsToday,
    ratingsWeek,
    ratingsPrevWeek,
    users,
    praises,
    flagged,

    ratings14,
    activityComplaints,
    activityPraises,
    newUsers,
    weekly,
  ] = await Promise.all([
    scope(db.from("complaints").select("status, upvote_count, category_id, created_at, updated_at")),
    scope(db.from("ratings").select("meal_id, stars, id").eq("rating_date", today).limit(5000)),
    scope(db.from("ratings").select("stars, rating_date").gte("rating_date", weekAgoISO).limit(10000)),
    scope(db.from("ratings").select("stars").gte("rating_date", prevWeekISO).lt("rating_date", weekAgoISO).limit(10000)),
    db.from("profiles").select("id, is_banned", { count: "exact" }).eq("institution_id", institution.id),
    scope(db.from("praises").select("id, text, praise_author, is_anonymous, created_at").order("created_at", { ascending: false }).limit(10)),
    scope(db.from("complaints").select("id, title").eq("is_flagged", true).limit(50)),
    scope(db.from("ratings").select("rating_date, meal_id, stars").gte("rating_date", since14ISO.slice(0, 10)).order("rating_date", { ascending: true })),
    scope(db.from("complaints").select("created_at").gte("created_at", since14ISO).order("created_at", { ascending: true })),
    scope(db.from("praises").select("created_at").gte("created_at", since14ISO).order("created_at", { ascending: true })),
    scope(db.from("profiles").select("created_at").gte("created_at", since14ISO).order("created_at", { ascending: true })),
    scope(db.from("complaints").select("status").gte("created_at", weekAgoISO)),
  ]);

  const all = complaints.data ?? [];
  const open = all.filter((c) => c.status !== "resolved").length;
  const resolved = all.length - open;
  const bannedCount = (users.data ?? []).filter((u) => u.is_banned).length;

  const perMeal = new Map<string, { sum: number; count: number }>();
  for (const r of ratingsToday.data ?? []) {
    const cur = perMeal.get(r.meal_id) ?? { sum: 0, count: 0 };
    cur.sum += r.stars;
    cur.count += 1;
    perMeal.set(r.meal_id, cur);
  }
  const meals = await db.from("meals").select("id, name").eq("institution_id", institution.id).eq("is_active", true).order("sort_order");
  const mealNames = (meals.data ?? []).map((m) => m.name);

  const weekRatingsRows = ratingsWeek.data ?? [];
  const weekAvg =
    weekRatingsRows.length > 0
      ? weekRatingsRows.reduce((s, r) => s + r.stars, 0) / weekRatingsRows.length
      : null;
  const prevRows = ratingsPrevWeek.data ?? [];
  const prevAvg = prevRows.length > 0 ? prevRows.reduce((s, r) => s + r.stars, 0) / prevRows.length : null;
  const weekDelta = pct(weekAvg, prevAvg);

  const days: string[] = [];
  const dateKey = (d: Date) => d.toISOString().slice(0, 10);
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateKey(d));
  }

  const bucket = (rows: { created_at?: string; rating_date?: string }[], key: "created_at" | "rating_date") => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = (r[key] as string) ?? "";
      m.set(k.slice(0, 10), (m.get(k.slice(0, 10)) ?? 0) + 1);
    }
    return days.map((d) => m.get(d) ?? 0);
  };

  const actRatings = bucket((ratings14.data ?? []) as { rating_date: string }[], "rating_date");
  const actComplaints = bucket((activityComplaints.data ?? []) as { created_at: string }[], "created_at");
  const actPraises = bucket((activityPraises.data ?? []) as { created_at: string }[], "created_at");
  const actUsers = bucket((newUsers.data ?? []) as { created_at: string }[], "created_at");

  const sparkDaily = new Map<string, { sum: number; n: number }>();
  for (const r of ratings14.data ?? []) {
    const cur = sparkDaily.get(r.rating_date) ?? { sum: 0, n: 0 };
    cur.sum += r.stars;
    cur.n += 1;
    sparkDaily.set(r.rating_date, cur);
  }
  const sparkData = days.map((d) => {
    const rec = sparkDaily.get(d);
    return {
      label: d,
      value: rec && rec.n > 0 ? +(rec.sum / rec.n).toFixed(2) : null,
    };
  });

  // per-meal daily trend (14d)
  const mealDaily = new Map<string, Map<string, { sum: number; n: number }>>();
  for (const r of ratings14.data ?? []) {
    const byMeal = mealDaily.get(r.meal_id) ?? new Map<string, { sum: number; n: number }>();
    const agg = byMeal.get(r.rating_date) ?? { sum: 0, n: 0 };
    agg.sum += r.stars;
    agg.n += 1;
    byMeal.set(r.rating_date, agg);
    mealDaily.set(r.meal_id, byMeal);
  }
  const mealTrend = days.map((d) => {
    const mealsOnDay: Record<string, number> = {};
    for (const [mealId, byDate] of mealDaily) {
      const rec = byDate.get(d);
      if (rec && rec.n > 0) mealsOnDay[mealId] = +(rec.sum / rec.n).toFixed(2);
    }
    return {
      label: new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      overall: null,
      meals: mealsOnDay,
    };
  });

  // rating distribution
  const dist = [0, 0, 0, 0, 0];
  for (const r of ratings14.data ?? []) dist[r.stars - 1] += 1;
  const distColor = ["var(--chart-4)", "var(--chart-1)", "var(--chart-1)", "var(--chart-2)", "var(--chart-2)"];
  const distBars = dist.map((n, i) => ({
    label: `${i + 1}★`,
    value: n,
    color: distColor[i],
  }));

  // categories
  const catCounts = new Map<string, number>();
  for (const c of all) {
    catCounts.set(c.category_id ?? "uncategorised", (catCounts.get(c.category_id ?? "uncategorised") ?? 0) + 1);
  }
  const cats = await db.from("complaint_categories").select("id, name").eq("institution_id", institution.id).eq("is_active", true).order("sort_order");
  const catName = new Map<string, string>();
  for (const c of cats.data ?? []) catName.set(c.id, c.name);
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  const catBars = [...catCounts.entries()]
    .map(([id, n], i) => ({
      label: catName.get(id) ?? "Other",
      value: n,
      color: palette[i % palette.length],
    }))
    .sort((a, b) => b.value - a.value);

  // resolution time (days)
  const resHours = all
    .filter((c) => c.status === "resolved" && c.created_at && c.updated_at)
    .map((c) => (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / 3.6e6)
    .filter((h) => h >= 0);
  const avgResHours = resHours.length ? resHours.reduce((a, b) => a + b, 0) / resHours.length : null;

  // weekly report
  const weeklyAll = weekly.data ?? [];
  const weeklyOpen = weeklyAll.filter((c) => c.status !== "resolved").length;
  const weeklyResolved = weeklyAll.filter((c) => c.status === "resolved").length;
  const weeklyRatings = weekRatingsRows.length;
  const weeklyPraises = (praises.data ?? []).length;


  const statusValues: Record<string, number> = { new: 0, in_progress: 0, resolved: 0 };
  for (const c of complaints.data ?? []) statusValues[c.status] = (statusValues[c.status] ?? 0) + 1;
  const statusColor: Record<string, string> = {
    new: "var(--chart-3)",
    in_progress: "var(--chart-2)",
    resolved: "var(--chart-1)",
  };
  const statusSegments = Object.entries(statusValues).map(([s, n]) => ({
    label: s === "in_progress" ? "in review" : s,
    value: n,
    color: statusColor[s] ?? "var(--chart-5)",
  }));
  const statusTotal = statusSegments.reduce((s, x) => s + x.value, 0);

  const stat = (label: string, value: string | number, sub?: React.ReactNode, spark?: React.ReactNode) => (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
      {spark && <div className="mt-2">{spark}</div>}
    </div>
  );

  const card = "card p-4";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[--sage-soft] text-[--sage]">
            <IconStats className="h-5 w-5" />
          </span>
          Dashboard
        </h1>
        <span className="text-xs text-muted">{today}</span>
      </div>

      {/* KPI grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stat("Total complaints", all.length, <Delta v={weeklyAll.length ? null : null} />)}
        {stat("Open", open, `${resolved} resolved`)}
        {stat("Users", users.count ?? (users.data ?? []).length, `${bannedCount} banned`)}
        {stat("Ratings today", (ratingsToday.data ?? []).length)}
        {stat(
          "Week avg rating",
          weekAvg !== null ? weekAvg.toFixed(2) + " ★" : "—",
          <Delta v={weekDelta} />,
          <Sparkline data={sparkData} />,
        )}
        {stat("Avg resolution", avgResHours !== null ? (avgResHours < 24 ? `${Math.round(avgResHours)}h` : `${(avgResHours / 24).toFixed(1)}d`) : "—", `${resHours.length} resolved`)}
        {stat("Flagged", (flagged.data ?? []).length)}
        {stat("Praises", praises.data?.length ?? 0)}
      </div>

      {/* Weekly report card */}
      <Link href="/admin/reports" className="card card-hover mt-4 block p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <IconNote className="h-4 w-4 text-[--accent]" /> This week
          </h2>
          <span className="text-xs font-medium text-[--accent-strong]">Full report →</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="font-display text-xl font-bold">{weeklyRatings}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">Ratings</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{weeklyPraises}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">Praises</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-[--sage]">{weeklyResolved}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">Resolved</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-[#C4503B] dark:text-[#E5765F]">{weeklyOpen}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">Open</p>
          </div>
        </div>
      </Link>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className={card}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Rating distribution · 14d</h2>
          </div>
          <div className="mt-3">
            <HBars items={distBars} />
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Complaint status</h2>
            <span className="text-[11px] text-muted">{statusTotal} total</span>
          </div>
          <div className="mt-3">
            <Donut segments={statusSegments} centerLabel="status" />
          </div>
        </div>
      </div>

      <div className={card + " mt-4"}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Daily average per meal · 14d</h2>
          <span className="text-[11px] text-muted">{mealNames.join(" · ")}</span>
        </div>
        <div className="mt-3">
          <AreaTrend data={mealTrend} mealNames={mealNames} height={200} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className={card}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Activity · last 14 days</h2>
          </div>
          <div className="mt-3">
            <ActivityBars
              series={[
                { label: "Ratings", values: actRatings },
                { label: "Complaints", values: actComplaints },
                { label: "Praises", values: actPraises },
                { label: "New users", values: actUsers },
              ]}
              labels={days}
            />
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Issues by category</h2>
          </div>
          <div className="mt-3">
            <HBars items={catBars} />
          </div>
        </div>
      </div>

      <h2 className="section-label mb-3 mt-6">Today&apos;s ratings per meal</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(meals.data ?? []).map((m) => {
          const v = perMeal.get(m.id);
          return stat(
            m.name,
            v ? v.sum / v.count === Math.round(v.sum / v.count) ? (v.sum / v.count).toFixed(0) + " ★" : (v.sum / v.count).toFixed(1) + " ★" : "—",
            v ? `${v.count} rated` : "no ratings",
          );
        })}
      </div>

      {flagged.data && flagged.data.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-semibold text-[#C4503B]">🚩 Flagged for review</h2>
          <div className="space-y-2">
            {(flagged.data as { id: string; title: string }[]).map((c) => (
              <div key={c.id} className="card flex items-center justify-between p-3 text-sm">
                <span>{c.title}</span>
                <a href={`/admin/complaints?focus=${c.id}`} className="text-xs font-medium text-[#C4503B]">
                  Review →
                </a>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="section-label mb-2 mt-6">Latest praises</h2>
      <div className="space-y-2">
        {(praises.data ?? []).map((p) => (
          <div key={p.id} className="card flex items-start justify-between gap-3 p-3 text-sm">
            <div>
              <p>{p.text}</p>
              <p className="mt-0.5 text-xs text-muted">
                {p.is_anonymous || !p.praise_author ? "Anonymous" : p.praise_author}
              </p>
            </div>
            <form action={async () => { "use server"; await deletePraise(p.id); }}>
              <button className="text-xs text-red-400 hover:text-red-600">Delete</button>
            </form>
          </div>
        ))}
        {(praises.data ?? []).length === 0 && (
          <p className="card border-dashed p-4 text-center text-sm text-muted">No praises yet.</p>
        )}
      </div>
    </div>
  );
}