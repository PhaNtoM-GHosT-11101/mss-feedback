import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return {
    user,
    profile,
    isAdmin: !!isAdmin,
    isCommittee: !!isCommittee,
  };
}
