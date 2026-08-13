import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getCommittee() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .single();

  const [{ data: isAdmin }, { data: isCommittee }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.rpc("is_committee"),
  ]);

  if (!isCommittee) redirect("/");

  // mess-scoped committee: which mess(es) they manage (null mess_id = all)
  let messIds: string[] | null = null;
  if (!isAdmin) {
    const { data: rows } = await createAdminClient()
      .from("admin_members")
      .select("mess_id")
      .eq("user_id", user.id)
      .not("mess_id", "is", null);
    messIds = (rows ?? []).map((r) => r.mess_id as string);
  }

  return {
    user,
    profile,
    isAdmin: !!isAdmin,
    isCommittee: !!isCommittee,
    messIds,
  };
}
