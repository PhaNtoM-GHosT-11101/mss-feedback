import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { formatDate, timeAgo } from "@/lib/format";
import { todayISO } from "@/lib/meal";
import { deleteAnnouncement } from "../actions";
import { MenuEditor, AnnouncementForm, MessMealToggles, MessSelector } from "./menu-editor";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ mess?: string }>;
}) {
  const { messIds, institution } = await getCommittee();
  const db = createAdminClient();
  const today = todayISO();
  const sp = await searchParams;
  const scopeMessId = sp.mess ?? "";

  const [meals, messes] = await Promise.all([
    db.from("meals").select("*").eq("institution_id", institution.id).eq("is_active", true).order("sort_order"),
    db.from("messes").select("*").eq("institution_id", institution.id).eq("is_active", true).order("name"),
  ]);

  // a mess-scoped committee can only pick their own mess
  const allowedMessIds = messIds?.length ? messIds : (messes.data ?? []).map((m) => m.id);
  const effectiveMessId = allowedMessIds.includes(scopeMessId) ? scopeMessId : "";

  // menu items: today's (per-mess or shared) + the weekly template
  const menuQuery = db
    .from("menu_items")
    .select("*")
    .eq("institution_id", institution.id)
    .or(`menu_date.eq.${today},and(is_template.eq.true,weekday.eq.${new Date().getUTCDay()})`)
    .limit(200);
  const todaysMenu = effectiveMessId
    ? await menuQuery.or(`mess_id.eq.${effectiveMessId},mess_id.is.null`)
    : await menuQuery;
  const settings = effectiveMessId
    ? await db.from("mess_meal_settings").select("*").eq("institution_id", institution.id).eq("mess_id", effectiveMessId)
    : { data: [] as { meal_id: string; is_active: boolean }[] };
  const announcements = await db
    .from("announcements")
    .select("*")
    .eq("institution_id", institution.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const activeMealIds = new Set(
    (settings.data ?? [])
      .filter((s) => s.is_active)
      .map((s) => s.meal_id),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Menu & Notices</h1>
        <MessSelector
          messes={messes.data ?? []}
          current={effectiveMessId}
          scoped={messIds?.length ? messIds : null}
        />
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold">
          {effectiveMessId
            ? `Today's menu — ${messes.data?.find((m) => m.id === effectiveMessId)?.name ?? ""} (${formatDate(today)})`
            : `Today's menu — all messes (${formatDate(today)})`}
        </h2>
        <MenuEditor
          meals={meals.data ?? []}
          existing={todaysMenu.data ?? []}
          messId={effectiveMessId || null}
          activeMealIds={activeMealIds}
        />
      </div>

      {effectiveMessId && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold">Meals served in this mess</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Turn off meals this mess doesn&apos;t serve (e.g. evening snacks).
          </p>
          <MessMealToggles
            messId={effectiveMessId}
            meals={meals.data ?? []}
            activeMealIds={activeMealIds}
          />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold">New announcement</h2>
        <AnnouncementForm />
        <div className="mt-4 space-y-2">
          {(announcements.data ?? []).map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
              <div>
                <p className="font-medium">{a.title}</p>
                {a.body && <p className="text-xs text-gray-500">{a.body}</p>}
                <p className="mt-0.5 text-[11px] text-gray-400">{timeAgo(a.created_at)}</p>
              </div>
              <form action={async () => { "use server"; await deleteAnnouncement(a.id); }}>
                <button className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </form>
            </div>
          ))}
          {(announcements.data ?? []).length === 0 && (
            <p className="text-center text-xs text-gray-400">No announcements.</p>
          )}
        </div>
      </div>
    </div>
  );
}