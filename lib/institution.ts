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
  theme: string | null;
  tagline: string | null;
};

const list = unstable_cache(
  async (): Promise<Institution[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("institutions")
      .select("id, name, slug, kind, theme, tagline")
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
      .select("id, name, slug, kind, theme, tagline")
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
      .select("id, name, slug, kind, theme, tagline")
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
 * The proxy sets the slug header from the URL (which the visitor picked or was
 * routed to). Any college's board is open to everyone, so the slug always wins.
 * For authenticated users with no slug in the URL we fall back to the
 * institution on their profile (e.g. during the auth flow).
 */
export async function getInstitution(): Promise<Institution | null> {
  const h = await headers();
  const slug = h.get(INST_HEADER);
  const slugInst = slug ? await bySlug(slug) : null;
  if (slugInst) return slugInst;

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
    if (profile?.institution_id) {
      const profInst = await byId(profile.institution_id);
      if (profInst) return profInst;
    }
  }
  return null;
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
    "complaints",
    "admin",
    "profile",
    "auth",
    "playground",
    "_next",
  ].includes(s);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
