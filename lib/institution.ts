import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { INST_HEADER } from "@/proxy";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Institution = {
  id: string;
  name: string;
  slug: string;
  kind: string | null;
};

const list = unstable_cache(
  async (): Promise<Institution[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("institutions")
      .select("id, name, slug, kind")
      .eq("is_active", true)
      .order("name");
    return (data ?? []) as Institution[];
  },
  ["institutions-list"],
  { revalidate: 60 * 60 },
);

const bySlug = unstable_cache(
  async (slug: string): Promise<Institution | null> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("institutions")
      .select("id, name, slug, kind")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    return (data as Institution | null) ?? null;
  },
  ["institution-by-slug"],
  { revalidate: 60 * 60 },
);

const byId = unstable_cache(
  async (id: string): Promise<Institution | null> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("institutions")
      .select("id, name, slug, kind")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();
    return (data as Institution | null) ?? null;
  },
  ["institution-by-id"],
  { revalidate: 60 * 60 },
);

/**
 * Resolve the institution for the current request.
 *
 * The proxy sets the slug header from the URL. For authenticated users the
 * authoritative tenant is their profile's institution (which RLS also honours),
 * so a forged header can't leak someone else's scoped data. For users without
 * an institution on their profile yet (e.g. just signed up) we fall back to the
 * slug so onboarding can adopt it.
 *
 * Exception: if the user is an admin/committee member of the institution named
 * by the URL slug, the slug wins. This lets admins open and manage any college
 * they belong to, and a super-admin to browse every institution.
 */
export async function getInstitution(): Promise<Institution | null> {
  const h = await headers();
  const slug = h.get(INST_HEADER);
  const slugInst = slug ? await bySlug(slug) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("institution_id")
      .eq("id", user.id)
      .maybeSingle();

    // Admins/committee can open the institution named by the slug (lets a
    // super-admin browse every college). Otherwise profile wins.
    if (slugInst && profile?.institution_id) {
      const admin = createAdminClient();
      const { data: member } = await admin
        .from("admin_members")
        .select("user_id")
        .eq("institution_id", slugInst.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (member) return slugInst;
    }

    if (profile?.institution_id) {
      const profInst = await byId(profile.institution_id);
      if (profInst) return profInst;
    }
  }
  return slugInst;
}

/**
 * getInstitution() that throws/redirects when there is no institution context.
 */
export async function requireInstitution(): Promise<Institution> {
  const inst = await getInstitution();
  if (!inst) redirect("/");
  return inst;
}

/** All active institutions (for the picker). */
export function listInstitutions() {
  return list();
}

/** Resolve a slug to an institution (throws nothing, null when unknown). */
export function getInstitutionBySlug(slug: string) {
  return bySlug(slug);
}

/** Set a user's institution on their profile (service role). */
export async function setProfileInstitution(
  userId: string,
  institutionId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ institution_id: institutionId })
    .eq("id", userId);
  return !error;
}

/** Pull the leading institution slug out of a path like "/nit-agartala/complaints". */
export function slugFromPath(path: string): string | null {
  const seg = path.split("/").filter(Boolean)[0];
  if (!seg) return null;
  if (RESERVED_HAS(seg)) return null;
  return SLUG_RE.test(seg) ? seg : null;
}

const RESERVED_HAS = (s: string) =>
  [
    "login",
    "onboard",
    "complaints",
    "mess",
    "admin",
    "stats",
    "praise",
    "profile",
    "auth",
    "playground",
    "_next",
  ].includes(s);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
