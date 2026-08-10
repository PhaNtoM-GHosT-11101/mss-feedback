import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { timeAgo } from "@/lib/format";
import { setUserBanned, deleteUser, updateUserProfile } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { isAdmin } = await getCommittee();
  const db = createAdminClient();

  const [profiles, adminMembers, authUsers] = await Promise.all([
    db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    db.from("admin_members").select("*"),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const emailBy = new Map<string, string>();
  for (const u of authUsers.data?.users ?? []) emailBy.set(u.id, u.email ?? "");

  const adminRoles = new Map<string, string>();
  for (const a of adminMembers.data ?? []) adminRoles.set(a.user_id, a.role);

  return (
    <div>
      <h1 className="text-lg font-semibold">Users</h1>
      <p className="text-xs text-gray-500">{(profiles.data ?? []).length} accounts</p>

      <div className="mt-4 space-y-2">
        {(profiles.data ?? []).map((p) => {
          const role = adminRoles.get(p.id);
          const email = emailBy.get(p.id) ?? "";
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.full_name}</span>
                  {p.is_banned && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950 dark:text-red-400">BANNED</span>
                  )}
                  {role && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${role === "admin" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}`}>
                      {role === "admin" ? "SUPER-ADMIN" : "COMMITTEE"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {email} · {p.roll_no ?? "no roll"} · joined {timeAgo(p.created_at)}
                </p>
              </div>

                <div className="flex items-center gap-2">
                <form action={async () => { "use server"; await setUserBanned(p.id, !p.is_banned); }}>
                  <button className={`rounded-lg px-3 py-1.5 text-xs font-medium ${p.is_banned ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" : "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/50"}`}>
                    {p.is_banned ? "Unban" : "Ban"}
                  </button>
                </form>
                {isAdmin && (
                  <form action={async () => { "use server"; await deleteUser(p.id); }}>
                    <button className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 dark:bg-gray-800 dark:text-gray-400">
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {(profiles.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
            No users yet.
          </p>
        )}
      </div>
    </div>
  );
}
