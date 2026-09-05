import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { formatDate } from "@/lib/format";
import { ExportButtons, RangePicker } from "./reports-ui";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { Donut } from "@/components/charts/Donut";
import { HBars } from "@/components/charts/HBars";
import { ActivityBars } from "@/components/charts/ActivityBars";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; range?: string }>;
}) {
  const { messIds, institution } = await getCommittee();
  const db = createAdminClient();
  const sp = await searchParams;
  const scope = <T,>(q: T): T => {
    if (messIds?.length) (q as unknown as { in: (col: string, vals: string[]) => void }).in("mess_id", messIds);
    return q;
  };

  const now = new Date();
  const days = sp.range === "90" ? 90 : sp.range === "7" ? 7 : 30;
  const from = sp.from?.slice(0, 10);
  const to = sp.to?.slice(0, 10);
  const rangeStart = from ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - days + 1);
    return d.toISOString().slice(0, 10);
  })();
  const rangeEnd = to ?? now.toISOString().slice(0, 10);

  const [meals, dailyRatings, complaints, praises, profiles] = await Promise.all([
    db.from("meals").select("*").eq("institution_id", institution.id).eq("is_active", true).order("sort_order"),
    scope(
      db
        .from("ratings")
        .select("rating_date, meal_id, stars")
        .eq("institution_id", institution.id)
        .gte("rating_date", rangeStart)
        .lte("rating_date", rangeEnd)
        .order("rating_date", { ascending: true }),
    ),
    scope(
      db
        .from("complaints")
        .select("*, category:complaint_categories!complaint_complaint_category_id_fkey(name), mess:messes(name)")
        .eq("institution_id", institution.id)
        .limit(5000),
    ),
    scope(
      db
        .from("praises")
        .select("created_at")
        .eq("institution_id", institution.id)
        .gte("created_at", rangeStart + "T00:00:00")
        .lte("created_at", rangeEnd + "T23:59:59"),
    ),
    db
      .from("profiles")
      .select("created_at")
      .eq("institution_id", institution.id)
      .gte("created_at", rangeStart + "T00:00:00")
      .lte("created_at", rangeEnd + "T23:59:59"),
  ]);

  const mealIdName = new Map<string, string>();
  for (const m of meals.data ?? []) mealIdName.set(m.id, m.name);

  const daily = new Map<string, Map<string, { sum: number; n: number }>>();
  for (const r of dailyRatings.data ?? []) {
    if (!mealIdName.has(r.meal_id)) continue;
    let byMeal = daily.get(r.rating_date);
    if (!byMeal) {
      byMeal = new Map();
      daily.set(r.rating_date, byMeal);
    }
    const agg = byMeal.get(r.meal_id) ?? { sum: 0, n: 0 };
    agg.sum += r.stars;
    agg.n += 1;
    byMeal.set(r.meal_id, agg);
  }
  const trend = [...daily.entries()]
    .map(([date, byMeal]) => {
      const overall = [...byMeal.values()].reduce((a, b) => ({ sum: a.sum + b.sum, n: a.n + b.n }), { sum: 0, n: 0 });
      return {
        date,
        label: formatDate(date),
        overall: overall.n ? +(overall.sum / overall.n).toFixed(2) : null,
        meals: Object.fromEntries(
          [...byMeal.entries()].map(([mealId, a]) => [mealIdName.get(mealId) ?? mealId, +(a.sum / a.n).toFixed(2)])
        ),
      };
    })
    .reverse();

  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const allComplaints = complaints.data ?? [];
  for (const c of allComplaints) {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
    const name = (c.category as { name: string } | null)?.name ?? "Uncategorised";
    categoryCounts[name] = (categoryCounts[name] ?? 0) + 1;
  }

  const statusColor: Record<string, string> = {
    new: "var(--chart-3)",
    in_progress: "var(--chart-2)",
    resolved: "var(--chart-1)",
  };
  const statusSegments = Object.entries(statusCounts).map(([s, n]) => ({
    label: s === "in_progress" ? "in review" : s,
    value: n,
    color: statusColor[s] ?? "var(--chart-5)",
  }));
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  const categoryBars = Object.entries(categoryCounts)
    .map(([name, n], i) => ({
      label: name,
      value: n,
      color: palette[i % palette.length],
    }))
    .sort((a, b) => b.value - a.value);

  // rating distribution
  const dist = [0, 0, 0, 0, 0];
  for (const r of dailyRatings.data ?? []) dist[r.stars - 1] += 1;
  const distBars = dist.map((n, i) => ({
    label: `${i + 1}★`,
    value: n,
    color: ["var(--chart-4)", "var(--chart-1)", "var(--chart-1)", "var(--chart-2)", "var(--chart-2)"][i],
  }));

  // resolution time
  const resHours = allComplaints
    .filter((c) => c.status === "resolved" && c.created_at && c.updated_at)
    .map((c) => (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / 3.6e6)
    .filter((h) => h >= 0);
  const avgRes = resHours.length ? resHours.reduce((a, b) => a + b, 0) / resHours.length : null;

  // praise + engagement trend
  const dateKey = (d: Date) => d.toISOString().slice(0, 10);
  const fillDays: string[] = [];
  const start = new Date(rangeStart + "T00:00:00");
  const end = new Date(rangeEnd + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) fillDays.push(dateKey(d));
  const pCount = new Map<string, number>();
  for (const p of praises.data ?? []) {
    const k = (p.created_at ?? "").slice(0, 10);
    pCount.set(k, (pCount.get(k) ?? 0) + 1);
  }
  const uCount = new Map<string, number>();
  for (const u of profiles.data ?? []) {
    const k = (u.created_at ?? "").slice(0, 10);
    uCount.set(k, (uCount.get(k) ?? 0) + 1);
  }
  const praiseBars = fillDays.map((d) => pCount.get(d) ?? 0);
  const userBars = fillDays.map((d) => uCount.get(d) ?? 0);

  // narrative
  const rangeRows = dailyRatings.data ?? [];
  const avgNow =
    rangeRows.length > 0 ? rangeRows.reduce((s, r) => s + r.stars, 0) / rangeRows.length : null;
  const mid = Math.floor(fillDays.length / 2);
  const firstHalf = rangeRows.filter((r) => fillDays.indexOf(r.rating_date) < mid);
  const secondHalf = rangeRows.filter((r) => fillDays.indexOf(r.rating_date) >= mid);
  const avgFirst = firstHalf.length ? firstHalf.reduce((s, r) => s + r.stars, 0) / firstHalf.length : null;
  const avgSecond = secondHalf.length ? secondHalf.reduce((s, r) => s + r.stars, 0) / secondHalf.length : null;
  const direction =
    avgFirst !== null && avgSecond !== null
      ? avgSecond > avgFirst + 0.05
        ? "up"
        : avgSecond < avgFirst - 0.05
          ? "down"
          : "steady"
      : "steady";
  const topCat = categoryBars[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">Reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          <RangePicker initial={{ from: rangeStart, to: rangeEnd, range: sp.range ?? "30" }} />
          <ExportButtons
            ratingsCSV={buildRatingsCSV(rangeRows, mealIdName)}
            complaintsCSV={buildComplaintsCSV(allComplaints)}
          />
        </div>
      </div>

      <p className="-mt-3 text-xs text-muted">
        {formatDate(rangeStart)} → {formatDate(rangeEnd)} ·{" "}
        {direction === "up" && `Ratings climbed ${(avgSecond! - avgFirst!).toFixed(1)}★ in the second half. `}
        {direction === "down" && `Ratings dipped ${(avgFirst! - avgSecond!).toFixed(1)}★ in the second half. `}
        {direction === "steady" && "Ratings held steady through the period. "}
        {avgNow !== null && `Overall average ${avgNow.toFixed(1)}★ across ${rangeRows.length} ratings.`}
        {topCat && topCat.value > 0 && ` Most common issue: ${topCat.label} (${topCat.value}).`}
        {avgRes !== null && ` Average resolution time ${avgRes < 24 ? `${Math.round(avgRes)}h` : `${(avgRes / 24).toFixed(1)}d`}.`}
      </p>

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Daily average rating</h2>
        <p className="text-xs text-muted">{[...mealIdName.values()].join(" · ")}</p>
        <AreaTrend
          data={trend.map((t) => ({ label: t.label, overall: t.overall, meals: t.meals }))}
          mealNames={[...mealIdName.values()]}
        />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-4">
          <h2 className="text-sm font-semibold">Rating distribution</h2>
          <div className="mt-3">
            <HBars items={distBars} />
          </div>
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold">Complaints by status</h2>
          <div className="mt-3">
            <Donut
              segments={statusSegments}
              centerValue={statusSegments.reduce((s, x) => s + x.value, 0).toString()}
              centerLabel="total"
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-4">
          <h2 className="text-sm font-semibold">Complaints by category</h2>
          <div className="mt-3">
            <HBars items={categoryBars} />
          </div>
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold">Avg resolution time</h2>
          <p className="mt-2 font-display text-4xl font-bold">
            {avgRes !== null ? (avgRes < 24 ? `${Math.round(avgRes)}h` : `${(avgRes / 24).toFixed(1)}d`) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted">across {resHours.length} resolved complaints</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-[--surface-2] p-3">
              <p className="font-display text-xl font-bold">{praises.data?.length ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted">Praises</p>
            </div>
            <div className="rounded-xl bg-[--surface-2] p-3">
              <p className="font-display text-xl font-bold">{profiles.data?.length ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted">New members</p>
            </div>
          </div>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Engagement — praises & new members</h2>
        <div className="mt-3">
          <ActivityBars
            series={[
              { label: "Praises", values: praiseBars },
              { label: "New users", values: userBars },
            ]}
            labels={fillDays.map((d) => formatDate(d))}
          />
        </div>
      </section>
    </div>
  );
}

function buildRatingsCSV(rows: { rating_date: string; meal_id: string; stars: number }[], mealIdName: Map<string, string>) {
  const lines = ["date,meal,rating"];
  for (const r of rows) {
    lines.push(`${r.rating_date},${mealIdName.get(r.meal_id) ?? r.meal_id},${r.stars}`);
  }
  return lines.join("\n");
}

function buildComplaintsCSV(
  rows: { id: string; created_at: string; title: string; status: string; upvote_count: number; category: { name: string } | null }[]
) {
  const lines = ["id,created,title,status,upvotes,category"];
  for (const c of rows) {
    const safe = c.title.replace(/"/g, '""');
    lines.push(`"${c.id}","${c.created_at}","${safe}",${c.status},${c.upvote_count},"${c.category?.name ?? ""}"`);
  }
  return lines.join("\n");
}
