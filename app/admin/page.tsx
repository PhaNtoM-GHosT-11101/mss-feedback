import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { todayISO } from "@/lib/meal";
import { deletePraise, deleteRating } from "./actions";
import { Donut } from "@/components/charts/Donut";
import { Sparkline } from "@/components/charts/Sparkline";
import { ActivityBars } from "@/components/charts/ActivityBars";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await getCommittee();
  const db = createAdminClient();
  const today = todayISO();

  const since14 = new Date();
  since14.setDate(since14.getDate() - 13);
  const since14ISO = since14.toISOString();
  const weekAgoISO = new Date(since14.getTime() + 6 * 864e5).toISOString().slice(0, 10);

  const [
    complaints,
    ratingsToday,
    ratingsWeek,
    users,
    praises,
    flagged,
    settings,
    ratings14,
    activityComplaints,
    activityPraises,
    newUsers,
  ] = await Promise.all([
    db.from("complaints").select("status, upvote_count"),
    db.from("ratings").select("meal_id, stars, id").eq("rating_date", today).limit(5000),
    db.from("ratings").select("stars, rating_date").gte("rating_date", weekAgoISO).limit(10000),
    db.from("profiles").select("id, is_banned", { count: "exact" }),
    db.from("praises").select("id, text, praise_author, is_anonymous, created_at").order("created_at", { ascending: false }).limit(10),
    db.from("complaints").select("id, title").eq("is_flagged", true).limit(50),
    db.from("settings").select("*").eq("key", "general").single(),
    db.from("ratings").select("rating_date").gte("rating_date", since14ISO.slice(0, 10)).order("rating_date", { ascending: true }),
    db.from("complaints").select("created_at").gte("created_at", since14ISO).order("created_at", { ascending: true }),
    db.from("praises").select("created_at").gte("created_at", since14ISO).order("created_at", { ascending: true }),
    db.from("profiles").select("created_at").gte("created_at", since14ISO).order("created_at", { ascending: true }),
  ]);

  const all = complaints.data ?? [];
  const open = all.filter((c) => c.status !== "resolved").length;
  const resolved = all.length - open;
  const totalUpvotes = all.reduce((s, c) => s + (c.upvote_count ?? 0), 0);
  const bannedCount = (users.data ?? []).filter((u) => u.is_banned).length;

  const perMeal = new Map<string, { sum: number; count: number }>();
  for (const r of ratingsToday.data ?? []) {
    const cur = perMeal.get(r.meal_id) ?? { sum: 0, count: 0 };
    cur.sum += r.stars;
    cur.count += 1;
    perMeal.set(r.meal_id, cur);
  }
  const meals = await db.from("meals").select("id, name").eq("is_active", true).order("sort_order");

  const weekAvg =
    (ratingsWeek.data ?? []).length > 0
      ? (ratingsWeek.data ?? []).reduce((s, r) => s + r.stars, 0) / (ratingsWeek.data ?? []).length
      : null;

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
  for (const r of ratingsWeek.data ?? []) {
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

  const digestEmails = (settings.data?.value as { digest_emails?: string[] })?.digest_emails ?? [];

  const statusValues: Record<string, number> = { new: 0, in_progress: 0, resolved: 0 };
  for (const c of complaints.data ?? []) statusValues[c.status] = (statusValues[c.status] ?? 0) + 1;
  const statusColor: Record<string, string> = {
    new: "var(--chart-3)",
    in_progress: "var(--chart-2)",
    resolved: "var(--chart-1)",
  };
  const statusSegments = Object.entries(statusValues).map(([s, n]) => ({
    label: s === "in_progress" ? "in progress" : s,
    value: n,
    color: statusColor[s] ?? "var(--chart-5)",
  }));

  const stat = (label: string, value: string | number, sub?: string, spark?: React.ReactNode) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      {spark && <div className="mt-2">{spark}</div>}
    </div>
  );

  const statusTotal = statusSegments.reduce((s, x) => s + x.value, 0);

  return (
    <div>
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <p className="text-xs text-gray-500">{today}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stat("Total complaints", all.length, `${open} open · ${resolved} resolved`)}
        {stat("Total upvotes", totalUpvotes)}
        {stat("Users", users.count ?? (users.data ?? []).length, `${bannedCount} banned`)}
        {stat("Ratings today", (ratingsToday.data ?? []).length)}
        {stat("Week avg rating", weekAvg !== null ? weekAvg.toFixed(2) + " ★" : "—", undefined,
          <Sparkline data={sparkData} />)}
        {stat("Flagged complaints", (flagged.data ?? []).length)}
        {stat("Digest emails", digestEmails.length, digestEmails.join(", ") || "not set")}
        {stat("Praises", praises.data?.length ?? 0)}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Complaint status</h2>
            <span className="text-[11px] text-gray-400">{statusTotal} total</span>
          </div>
          <div className="mt-3">
            <Donut segments={statusSegments} centerLabel="status" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Activity — last 14 days</h2>
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
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-gray-500 dark:text-gray-400">
        Today&apos;s ratings per meal
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(meals.data ?? []).map((m) => {
          const v = perMeal.get(m.id);
          return stat(
            m.name,
            v ? (v.sum / v.count).toFixed(1) + " ★" : "—",
            v ? `${v.count} rated` : "no ratings",
          );
        })}
      </div>

      {flagged.data && flagged.data.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-semibold text-red-500">🚩 Flagged for review</h2>
          <div className="space-y-2">
            {(flagged.data as { id: string; title: string }[]).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-red-200 bg-white p-3 text-sm dark:border-red-900 dark:bg-gray-900">
                <span>{c.title}</span>
                <a href={`/admin/complaints?focus=${c.id}`} className="text-xs text-red-500">
                  Review →
                </a>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold text-gray-500 dark:text-gray-400">
        Latest praises
      </h2>
      <div className="space-y-2">
        {(praises.data ?? []).map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
            <div>
              <p>{p.text}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {p.is_anonymous || !p.praise_author ? "Anonymous" : p.praise_author}
              </p>
            </div>
            <form action={async () => { "use server"; await deletePraise(p.id); }}>
              <button className="text-xs text-red-400 hover:text-red-600">Delete</button>
            </form>
          </div>
        ))}
        {(praises.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400 dark:border-gray-700">No praises yet.</p>
        )}
      </div>
    </div>
  );
}
