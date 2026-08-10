import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import RateMeal from "@/components/RateMeal";
import { AverageStars } from "@/components/Stars";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import { todayISO, todayMenuItems } from "@/lib/meal";
import type { Complaint, Meal, Praise } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: meals }, { data: myRatingsRaw }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, roll_no, mess_id, is_banned")
        .eq("id", user.id)
        .single(),
      supabase
        .from("meals")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      supabase.rpc("my_ratings"),
    ]);

  const messId = profile?.mess_id ?? null;
  if (messId === null) redirect("/onboard");
  const myRatings = (myRatingsRaw ?? []).filter(
    (r: { rating_date: string }) => r.rating_date === todayISO(),
  );

  const today = todayISO();
  const dow = (new Date().getUTCDay() + 1) % 7;

  const [{ data: menuRaw }, { data: ratingsToday }, { data: announcements }, top, praises] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("*")
        .or(`menu_date.eq.${today},and(is_template.eq.true,weekday.eq.${dow})`)
        .limit(50),
      supabase
        .from("ratings")
        .select("meal_id, stars")
        .eq("rating_date", today)
        .limit(5000),
      supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("complaints")
        .select(
          "id, title, status, upvote_count, created_at, is_pinned, complaint_author, complaint_author_roll",
        )
        .order("is_pinned", { ascending: false })
        .order("upvote_count", { ascending: false })
        .limit(3),
      supabase
        .from("praises")
        .select("id, text, is_anonymous, created_at, praise_author")
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  const perMeal = new Map<string, { sum: number; count: number }>();
  for (const row of (ratingsToday ?? []) as { meal_id: string; stars: number }[]) {
    const cur = perMeal.get(row.meal_id) ?? { sum: 0, count: 0 };
    cur.sum += row.stars;
    cur.count += 1;
    perMeal.set(row.meal_id, cur);
  }
  const averages = new Map<string, { avg: number; count: number }>();
  for (const [mealId, { sum, count }] of perMeal) {
    averages.set(mealId, { avg: sum / count, count });
  }

  const menu = todayMenuItems(menuRaw ?? []);
  const menuByMeal = new Map<string, typeof menu>();
  for (const item of menu) {
    const list = menuByMeal.get(item.meal_id) ?? [];
    list.push(item);
    menuByMeal.set(item.meal_id, list);
  }

  return (
    <div className="mx-auto max-w-3xl px-4">
      <NavBar userName={profile?.full_name} />

      {announcements && announcements.length > 0 && (
        <div className="mb-4 space-y-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/50"
            >
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                {a.title}
              </p>
              {a.body && (
                <p className="mt-0.5 text-emerald-700 dark:text-emerald-400">
                  {a.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
        Today&apos;s ratings
      </h2>
      <div className="space-y-3">
        {(meals ?? []).map((meal: Meal) => {
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

      <h2 className="mb-2 mt-6 text-sm font-semibold text-gray-500 dark:text-gray-400">
        Today&apos;s menu
      </h2>
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {(meals ?? []).map((meal: Meal) => {
          const items = menuByMeal.get(meal.id) ?? [];
          return (
            <div key={meal.id} className="py-1.5 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{meal.name}</span>
                {items.length > 0 ? (
                  <span className="text-right text-sm text-gray-600 dark:text-gray-300">
                    {items.map((i) => i.item_text).join(", ")}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">not posted</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/complaints/new"
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          + File a complaint
        </Link>
        <Link
          href="/praise"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          👏 Give praise
        </Link>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-gray-500 dark:text-gray-400">
        Top issues
      </h2>
      <div className="space-y-2">
        {(top.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400 dark:border-gray-700">
            No complaints yet — be the first voice.
          </p>
        )}
        {((top.data ?? []) as Complaint[]).map((c) => (
          <Link
            key={c.id}
            href={`/complaints/${c.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-3.5 transition hover:border-emerald-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-800"
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center rounded-lg bg-gray-50 px-2 py-1 dark:bg-gray-800">
                <span className="text-sm font-bold">{c.upvote_count}</span>
                <span className="text-[10px] text-gray-400">▲</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
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
            </div>
          </Link>
        ))}
        {(top.data ?? []).length > 0 && (
          <Link
            href="/complaints"
            className="block pt-1 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            View all complaints →
          </Link>
        )}
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-gray-500 dark:text-gray-400">
        Recent praise
      </h2>
      <div className="space-y-2">
        {(praises.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400 dark:border-gray-700">
            No praise yet — your mess staff would love one.
          </p>
        )}
        {((praises.data ?? []) as Praise[]).map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-gray-200 bg-white p-3.5 text-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <p>{p.text}</p>
            <p className="mt-1 text-xs text-gray-400">
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
