import { redirect } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowUpRight, Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import NavBar from "@/components/NavBar";
import RateMeal from "@/components/RateMeal";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import { todayISO, todayMenuItems } from "@/lib/meal";
import type { Complaint, Meal, Praise } from "@/lib/types";

export const dynamic = "force-dynamic";

const getShared = unstable_cache(
  async (today: string, dow: number) => {
    const db = createAdminClient();
    const [meals, menuRaw, ratingsToday, announcements, top, praises] =
      await Promise.all([
        db.from("meals").select("*").eq("is_active", true).order("sort_order"),
        db
          .from("menu_items")
          .select("*")
          .or(`menu_date.eq.${today},and(is_template.eq.true,weekday.eq.${dow})`)
          .limit(50),
        db.from("ratings").select("meal_id, stars").eq("rating_date", today).limit(5000),
        db
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3),
        db
          .from("complaints")
          .select("id, title, status, upvote_count, created_at, is_pinned, complaint_author, complaint_author_roll")
          .order("is_pinned", { ascending: false })
          .order("upvote_count", { ascending: false })
          .limit(3),
        db
          .from("praises")
          .select("id, text, is_anonymous, created_at, praise_author")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
    return { meals, menuRaw, ratingsToday, announcements, top, praises };
  },
  ["home-shared"],
  { revalidate: 30 },
);

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: myRatingsRaw }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, roll_no, mess_id, is_banned")
      .eq("id", user.id)
      .single(),
    supabase.rpc("my_ratings"),
  ]);

  const messId = profile?.mess_id ?? null;
  if (messId === null) redirect("/onboard");
  const myRatings = (myRatingsRaw ?? []).filter(
    (r: { rating_date: string }) => r.rating_date === todayISO(),
  );

  const today = todayISO();
  const dow = (new Date().getUTCDay() + 1) % 7;

  const { meals, menuRaw, ratingsToday, announcements, top, praises } =
    await getShared(today, dow);

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

  return (
    <div className="mx-auto max-w-lg px-4">
      <NavBar userName={profile?.full_name} />

      {announcements.data && announcements.data.length > 0 && (
        <div className="mb-4 space-y-2">
          {announcements.data.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/40"
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                {a.title}
              </p>
              {a.body && (
                <p className="mt-0.5 text-sm text-emerald-700/90 dark:text-emerald-400/90">
                  {a.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="section-label">Today&apos;s ratings</h2>
        <span className="text-[11px] text-zinc-400">{today}</span>
      </div>
      <div className="space-y-3">
        {(meals.data ?? []).map((meal: Meal) => {
          const my = myRatings.find(
            (r: { meal_id: string }) => r.meal_id === meal.id,
          );
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
        {(meals.data ?? []).map((meal: Meal, i: number) => {
          const items = menuByMeal.get(meal.id) ?? [];
          return (
            <div
              key={meal.id}
              className={`flex items-center gap-3 py-2 ${
                i > 0 ? "border-t border-zinc-100 dark:border-zinc-800" : "pt-0"
              }`}
            >
              <span className="w-6 text-center text-lg">{["🍞", "🍛", "🍵", "🍜"][i] ?? "🍽️"}</span>
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{meal.name}</span>
                {items.length > 0 ? (
                  <span className="truncate text-right text-sm text-zinc-500 dark:text-zinc-400">
                    {items.map((i) => i.item_text).join(", ")}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-300 dark:text-zinc-600">
                    not posted
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/complaints/new"
          className="btn-primary flex flex-1 items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> File a complaint
        </Link>
        <Link
          href="/praise"
          className="btn-ghost flex flex-1 items-center justify-center gap-1.5"
        >
          👏 Give praise
        </Link>
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="section-label">Top issues</h2>
        <Link
          href="/complaints"
          className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          View all
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {(top.data ?? []).length === 0 && (
          <p className="card border-dashed p-5 text-center text-sm text-zinc-400">
            No complaints yet — be the first voice.
          </p>
        )}
        {((top.data ?? []) as Complaint[]).map((c) => (
          <Link
            key={c.id}
            href={`/complaints/${c.id}`}
            className="card card-hover group flex items-start gap-3 p-3.5"
          >
            <div className="flex flex-col items-center rounded-lg bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
              <span className="text-sm font-bold">{c.upvote_count}</span>
              <span className="text-[10px] text-zinc-400">▲</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.title}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColor(c.status)}`}
                >
                  {statusLabel(c.status)}
                </span>
                {c.complaint_author && (
                  <span className="truncate">{c.complaint_author}</span>
                )}
                <span>{timeAgo(c.created_at)}</span>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:text-zinc-500" />
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="section-label">Recent praise</h2>
        <Link
          href="/praise"
          className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          View all
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {(praises.data ?? []).length === 0 && (
          <p className="card border-dashed p-5 text-center text-sm text-zinc-400">
            No praise yet — your mess staff would love one.
          </p>
        )}
        {((praises.data ?? []) as Praise[]).map((p) => (
          <div key={p.id} className="card p-3.5 text-sm">
            <p>{p.text}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {p.is_anonymous || !p.praise_author
                ? "Anonymous"
                : p.praise_author}{" "}
              · {timeAgo(p.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
