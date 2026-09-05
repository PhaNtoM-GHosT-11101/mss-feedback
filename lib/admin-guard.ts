import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInstitution } from "@/lib/institution";
import { AUTH_BYPASS_ENABLED } from "@/lib/testing";

export async function getCommittee() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !AUTH_BYPASS_ENABLED) redirect("/login");

  const institution = await getInstitution();
  if (!institution) redirect("/");

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("id, full_name, institution_id")
        .eq("id", user.id)
        .single()
    : { data: null };

  // Authority is keyed to the resolved (slug) institution, not the profile's
  // institution, so an admin opening any college they manage sees admin there.
  const isAdmin = AUTH_BYPASS_ENABLED
    ? true
    : user
      ? (await supabase.rpc("is_admin_in", { inst: institution.id })).data
      : false;
  const isCommittee = AUTH_BYPASS_ENABLED
    ? true
    : user
      ? (await supabase.rpc("is_committee_in", { inst: institution.id })).data
      : false;

  if (!isCommittee) redirect("/");

  // mess-scoped committee: which mess(es) they manage (null mess_id = all)
  let messIds: string[] | null = null;
  if (!isAdmin && user) {
    const { data: rows } = await createAdminClient()
      .from("admin_members")
      .select("mess_id")
      .eq("institution_id", institution.id)
      .eq("user_id", user.id)
      .not("mess_id", "is", null);
    messIds = (rows ?? []).map((r) => r.mess_id as string);
  }

  return {
    user: user ?? null,
    profile,
    institution,
    isAdmin: !!isAdmin,
    isCommittee: !!isCommittee,
    messIds,
  };
}
