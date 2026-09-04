import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { CategoriesEditor, MealsEditor, MessesEditor, GeneralEditor, MembersEditor } from "./editors";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { isAdmin, institution } = await getCommittee();
  const db = createAdminClient();

  const [categories, meals, messes, settings, members, authUsers, instProfiles] = await Promise.all([
    db.from("complaint_categories").select("*").eq("institution_id", institution.id).order("sort_order"),
    db.from("meals").select("*").eq("institution_id", institution.id).order("sort_order"),
    db.from("messes").select("*").eq("institution_id", institution.id).order("name"),
    db.from("settings").select("*").eq("institution_id", institution.id),
    db.from("admin_members").select("*").eq("institution_id", institution.id),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db.from("profiles").select("id").eq("institution_id", institution.id),
  ]);

  const instUserIds = new Set((instProfiles.data ?? []).map((p) => p.id));
  const emailBy = new Map<string, string>();
  for (const u of authUsers.data?.users ?? []) {
    if (instUserIds.size === 0 || instUserIds.has(u.id)) {
      emailBy.set(u.id, u.email ?? "");
    }
  }
  const general = settings.data?.find((s) => s.key === "general")?.value as {
    daily_complaint_limit?: number;
    digest_emails?: string[];
    weekly_report_emails?: string[];
  } ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Settings</h1>
      <p className="-mt-4 text-xs text-gray-500">
        {isAdmin ? "You have full super-admin control." : "You have committee access — settings below are read-only."}
      </p>

      {isAdmin && (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-semibold">Complaint categories</h2>
            <CategoriesEditor initial={categories.data ?? []} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-semibold">Meal slots & rating hours</h2>
            <p className="text-xs text-gray-400">Students can rate only during these hours (Asia/Kolkata).</p>
            <MealsEditor initial={meals.data ?? []} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-semibold">Messes</h2>
            <MessesEditor initial={messes.data ?? []} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-semibold">Rules & email alerts</h2>
            <GeneralEditor initial={general} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-semibold">Committee members</h2>
            <p className="text-xs text-gray-400">
              Committee: reply to complaints + view reports. Super-admin: everything.
            </p>
            <MembersEditor
              members={(members.data ?? []) as { user_id: string; role: string; mess_id: string | null; created_at: string }[]}
              emailBy={emailBy}
              authEmails={[...emailBy.values()]}
              messes={messes.data ?? []}
            />
          </section>
        </>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold">Data snapshot</h2>
        <p className="mt-1 text-xs text-gray-400">
          {categories.data?.length} categories · {meals.data?.length} meal slots · {messes.data?.length} messes
        </p>
      </section>
    </div>
  );
}
