import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { todayISO } from "@/lib/meal";
import { deletePraise, deleteRating } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await getCommittee();
  const db = createAdminClient();
  const today = todayISO();

  const [
    complaints,
    ratingsToday,
    ratingsWeek,
    users,
    praises,
    flagged,
    settings,
  ] = await Promise.all([
    db.from("complaints").select("status, upvote_count"),
    db.from("ratings").select("meal_id, stars, id").eq("rating_date", today).limit(5000),
    db.from("ratings").select("stars, rating_date").gte("rating_date", new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)).limit(10000),
    db.from("profiles").select("id, is_banned", { count: "exact" }),
    db.from("praises").select("id, text, praise_author, is_anonymous, created_at").order("created_at", { ascending: false }).limit(10),
    db.from("complaints").select("id, title").eq("is_flagged", true).limit(50),
    db.from("settings").select("*").eq("key", "general").single(),
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

  const digestEmails = (settings.data?.value as { digest_emails?: string[] })?.digest_emails ?? [];

  const stat = (label: string, value: string | number, sub?: string) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  );

  return (
    <div>
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <p className="text-xs text-gray-500">{today}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stat("Total complaints", all.length, `${open} open · ${resolved} resolved`)}
        {stat("Total upvotes", totalUpvotes)}
        {stat("Users", users.count ?? (users.data ?? []).length, `${bannedCount} banned`)}
        {stat("Ratings today", (ratingsToday.data ?? []).length)}
        {stat("Week avg rating", weekAvg !== null ? weekAvg.toFixed(2) + " ★" : "—")}
        {stat("Flagged complaints", (flagged.data ?? []).length)}
        {stat("Digest emails", digestEmails.length, digestEmails.join(", ") || "not set")}
        {stat("Praises", praises.data?.length ?? 0)}
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
