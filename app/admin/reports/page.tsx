import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { formatDate } from "@/lib/format";
import { TrendChart, ExportButtons } from "./reports-ui";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await getCommittee();
  const db = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceISO = since.toISOString().slice(0, 10);

  const [meals, dailyRatings, weekRatings, complaints] = await Promise.all([
    db.from("meals").select("*").eq("is_active", true).order("sort_order"),
    db
      .from("ratings")
      .select("rating_date, meal_id, stars")
      .gte("rating_date", sinceISO)
      .order("rating_date", { ascending: true }),
    db.from("ratings").select("rating_date, meal_id, stars").gte("rating_date", "2026-01-01"),
    db.from("complaints").select("*, category:complaint_categories!complaint_complaint_category_id_fkey(name)"),
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
    agg.sum += r.rating;
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
  for (const c of complaints.data ?? []) {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
  }
  const categoryCounts: Record<string, number> = {};
  for (const c of complaints.data ?? []) {
    const name = (c.category as { name: string } | null)?.name ?? "Uncategorised";
    categoryCounts[name] = (categoryCounts[name] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Reports</h1>
        <ExportButtons
          ratingsCSV={buildRatingsCSV(weekRatings.data ?? [], mealIdName)}
          complaintsCSV={buildComplaintsCSV(complaints.data ?? [])}
        />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold">Last 30 days — daily average rating</h2>
        <p className="text-xs text-gray-400">
          {[...mealIdName.values()].join(" · ")}
        </p>
        <TrendChart
          data={trend.map((t) => ({ label: t.label, overall: t.overall, meals: t.meals }))}
          mealNames={[...mealIdName.values()]}
        />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold">Complaints by status</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(statusCounts).map(([status, n]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize text-gray-600 dark:text-gray-300">{status}</span>
                <span className="font-medium">{n}</span>
              </div>
            ))}
            {Object.keys(statusCounts).length === 0 && <p className="text-xs text-gray-400">No complaints.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold">Complaints by category</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(categoryCounts).map(([name, n]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">{name}</span>
                <span className="font-medium">{n}</span>
              </div>
            ))}
            {Object.keys(categoryCounts).length === 0 && <p className="text-xs text-gray-400">No complaints.</p>}
          </div>
        </section>
      </div>
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
