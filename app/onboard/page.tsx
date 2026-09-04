import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstitution, setProfileInstitution } from "@/lib/institution";
import OnboardClient from "./onboard-client";
import type { Mess } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const institution = await getInstitution();
  if (!institution) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, institution_id, mess_id, roll_no")
    .eq("id", user.id)
    .single();

  // Adopt the institution from the URL if not set yet (ties RLS scoping to it).
  if (!profile?.institution_id || profile.institution_id !== institution.id) {
    await setProfileInstitution(user.id, institution.id);
  }

  const { data: messes } = await supabase
    .from("messes")
    .select("id, name, mess_type, is_active")
    .eq("institution_id", institution.id)
    .eq("is_active", true)
    .order("name");

  return (
    <OnboardClient
      institutionName={institution.name}
      institutionSlug={institution.slug}
      messes={(messes ?? []) as Mess[]}
      existingMessId={profile?.mess_id ?? null}
      existingRoll={profile?.roll_no ?? null}
    />
  );
}
