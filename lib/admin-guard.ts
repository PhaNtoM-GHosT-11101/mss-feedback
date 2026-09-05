import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_BYPASS_ENABLED } from "@/lib/testing";

// The person who built the app — the only super admin.
export const SUPER_ADMIN_USER_ID = "61aef4a7-a744-4e99-b6f4-284254cc457f";

export async function getSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isCreator = !!user && user.id === SUPER_ADMIN_USER_ID;
  // Under the testing bypass there is no identity to compare — keep the page
  // reachable so the creator can still experiment.
  if (!isCreator && !AUTH_BYPASS_ENABLED) redirect("/");

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return { user: user ?? null, profile, isCreator };
}