import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInstitutionBySlug, setProfileInstitution, slugFromPath } from "@/lib/institution";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";

  if (code) {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // Adopt the institution from the destination slug so the user's profile
      // (and therefore RLS scoping via current_institution_id()) lines up.
      const slug = slugFromPath(next);
      if (slug) {
        const inst = await getInstitutionBySlug(slug);
        if (inst) await setProfileInstitution(user.id, inst.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
