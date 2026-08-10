import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { formatDate, timeAgo } from "@/lib/format";
import { todayISO } from "@/lib/meal";
import { deleteMenuItem, deleteAnnouncement } from "../actions";
import { MenuEditor, AnnouncementForm } from "./menu-editor";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  await getCommittee();
  const db = createAdminClient();
  const today = todayISO();

  const [meals, todaysMenu, announcements] = await Promise.all([
    db.from("meals").select("*").eq("is_active", true).order("sort_order"),
    db.from("menu_items").select("*").eq("menu_date", today).order("created_at"),
    db
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <h1 className="text-lg font-semibold">Menu & Notices</h1>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold">Today&apos;s menu ({formatDate(today)})</h2>
        <MenuEditor meals={meals.data ?? []} existing={todaysMenu.data ?? []} />
      </div>

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
