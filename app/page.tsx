import { redirect } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import NavBar from "@/components/NavBar";
import RateMeal from "@/components/RateMeal";
import { IconPraise, IconComplaint, IconArrowUp, IconTrendingUp } from "@/components/icons";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import { todayISO, todayMenuItems, mealColor } from "@/lib/meal";
import type { Complaint, Meal, Praise } from "@/lib/types";

export const dynamic = "force-dynamic";

const getShared = unstable_cache(
  async (today: string, dow: number, messId: string) => {
    const db = createAdminClient();
    const [meals, menuRaw, ratingsToday, announcements, top, praises, mealSettings] =
      await Promise.all([
        db.from("meals").select("*").eq("is_active", true).order("sort_order"),
        db
          .from("menu_items")
          .select("*")
          .or(`menu_date.eq.${today},and(is_template.eq.true,weekday.eq.${dow})`)
          .or(`mess_id.eq.${messId},mess_id.is.null`)
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
        db
          .from("mess_meal_settings")
          .select("meal_id, is_active")
          .eq("mess_id", messId),
      ]);
    return { meals, menuRaw, ratingsToday, announcements, top, praises, mealSettings };
  },
  ["home-shared"],
  { revalidate: 60 },
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

  if (profile?.is_banned) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-500 dark:bg-red-950/50">
          !
        </div>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">Account suspended</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Your account has been suspended by the mess committee for violating the code of
          conduct. If you believe this is a mistake, contact the committee.
        </p>
      </div>
    );
  }
  if (messId === null) redirect("/onboard");
  const myRatings = (myRatingsRaw ?? []).filter(
    (r: { rating_date: string }) => r.rating_date === todayISO(),
  );

  const today = todayISO();
  const dow = new Date().getUTCDay();

  const { meals, menuRaw, ratingsToday, announcements, top, praises, mealSettings } =
    await getShared(today, dow, messId);

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

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 5 ? "Burning the midnight oil" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const fullDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const allAvg = [...averages.values()];
  const todayAvg = allAvg.length
    ? allAvg.reduce((s, a) => s + a.avg, 0) / allAvg.length
    : null;
  const ratedTotal = allAvg.reduce((s, a) => s + a.count, 0);
  const bestMeal = allAvg.length
    ? [...averages.entries()].sort((a, b) => b[1].avg - a[1].avg)[0]
    : null;
  const mealsList = messMeals;

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar userName={profile?.full_name} />

      {/* Greeting */}
      <div className="pt-3">
        <p className="section-label">{fullDate}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
          {greeting}, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
        </h1>
      </div>

      {/* Mini stats strip */}
      <div className="stagger mt-4 grid grid-cols-3 gap-2">
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
            {bestMeal ? mealsList.find((m) => m.id === bestMeal[0])?.name ?? "—" : "—"}
          </p>
        </div>
      </div>

      {announcements.data && announcements.data.length > 0 && (
        <div className="stagger mt-4 space-y-2">
          {announcements.data.map((a) => (
            <div
              key={a.id}
              className="card flex items-start gap-3 border-[--accent]/30 bg-[--accent-soft]/60 p-3.5"
            >
              <span className="text-lg leading-none">📢</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                {a.body && (
                  <p className="mt-0.5 text-sm text-muted">{a.body}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3 mt-6 flex items-baseline justify-between">
        <h2 className="section-label">Rate today&apos;s meals</h2>
        <span className="text-[11px] text-muted">{today}</span>
      </div>
      <div className="stagger grid gap-3 sm:grid-cols-2">
        {messMeals.map((meal: Meal) => {
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
        {messMeals.map((meal: Meal, i: number) => {
          const items = menuByMeal.get(meal.id) ?? [];
          const c = mealColor(meal);
          return (
            <div
              key={meal.id}
              className={`flex items-center gap-3 py-2.5 ${
                i > 0 ? "border-t border-border" : "pt-0"
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <span className="font-display text-sm font-semibold">{meal.name}</span>
                {items.length > 0 ? (
                  <span className="truncate text-right text-sm text-muted">
                    {items.map((i) => i.item_text).join(", ")}
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
          href="/complaints/new"
          className="btn btn-primary flex flex-1 items-center justify-center gap-1.5"
        >
          <IconComplaint className="h-4 w-4" /> File a complaint
        </Link>
        <Link
          href="/praise"
          className="btn btn-accent flex flex-1 items-center justify-center gap-1.5"
        >
          <IconPraise className="h-4 w-4" /> Give praise
        </Link>
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="section-label">Top issues</h2>
        <Link
          href="/complaints"
          className="text-[11px] font-medium text-muted hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(top.data ?? []).length === 0 && (
          <p className="card border-dashed p-5 text-center text-sm text-muted sm:col-span-2">
            No complaints yet — be the first voice.
          </p>
        )}
        {((top.data ?? []) as Complaint[]).map((c) => (
          <Link
            key={c.id}
            href={`/complaints/${c.id}`}
            className="card card-hover group flex items-start gap-3 p-3.5"
          >
            <div className="flex flex-col items-center rounded-lg bg-[--surface-2] px-2 py-1">
              <span className="text-sm font-bold">{c.upvote_count}</span>
              <IconArrowUp className="h-3 w-3 text-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.title}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span className={statusColor(c.status)}>{statusLabel(c.status)}</span>
                {c.complaint_author && (
                  <span className="truncate">{c.complaint_author}</span>
                )}
                <span>{timeAgo(c.created_at)}</span>
              </div>
            </div>
            <IconArrowUp className="hidden h-4 w-4 shrink-0 rotate-45 text-muted transition group-hover:text-foreground" />
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="section-label">Recent praise</h2>
        <Link
          href="/praise"
          className="text-[11px] font-medium text-muted hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(praises.data ?? []).length === 0 && (
          <p className="card border-dashed p-5 text-center text-sm text-muted sm:col-span-2">
            No praise yet — your mess staff would love one.
          </p>
        )}
        {((praises.data ?? []) as Praise[]).map((p) => (
          <div key={p.id} className="card p-3.5 text-sm">
            <p>{p.text}</p>
            <p className="mt-1 text-xs text-muted">
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
