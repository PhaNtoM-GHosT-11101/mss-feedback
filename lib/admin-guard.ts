import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInstitution } from "@/lib/institution";

export async function getCommittee() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const institution = await getInstitution();
  if (!institution) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, institution_id")
    .eq("id", user.id)
    .single();

  // Authority is keyed to the resolved (slug) institution, not the profile's
  // institution, so an admin opening any college they manage sees admin there.
  const [{ data: isAdmin }, { data: isCommittee }] = await Promise.all([
    supabase.rpc("is_admin_in", { inst: institution.id }),
    supabase.rpc("is_committee_in", { inst: institution.id }),
  ]);

  if (!isCommittee) redirect("/");

  // mess-scoped committee: which mess(es) they manage (null mess_id = all)
  let messIds: string[] | null = null;
  if (!isAdmin) {
    const { data: rows } = await createAdminClient()
      .from("admin_members")
      .select("mess_id")
      .eq("institution_id", institution.id)
      .eq("user_id", user.id)
      .not("mess_id", "is", null);
    messIds = (rows ?? []).map((r) => r.mess_id as string);
  }

  return {
    user,
    profile,
    institution,
    isAdmin: !!isAdmin,
    isCommittee: !!isCommittee,
    messIds,
  };
}
