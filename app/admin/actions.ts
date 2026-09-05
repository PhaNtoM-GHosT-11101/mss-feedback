"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdmin } from "@/lib/admin-guard";

async function superCtx() {
  await getSuperAdmin();
  return createAdminClient();
}

function cleanSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------- Colleges ----------

export async function addInstitution(formData: FormData) {
  const db = await superCtx();
  const name = (formData.get("name") as string)?.trim() ?? "";
  const slug = cleanSlug((formData.get("slug") as string)?.trim() ?? "");
  const kind = (formData.get("kind") as string)?.trim() || "College";
  if (!name || !slug) return;
  await db.from("institutions").insert({
    name,
    slug,
    kind,
    theme: "amber",
    is_active: true,
  });
  revalidatePath("/admin");
}

export async function updateInstitution(
  id: string,
  data: {
    name?: string;
    slug?: string;
    theme?: string;
    tagline?: string | null;
    is_active?: boolean;
  },
) {
  const db = await superCtx();
  await db.from("institutions").update(data).eq("id", id);
  revalidatePath("/admin");
}

// ---------- Categories ----------

export async function addCategory(institutionId: string, name: string, isMess = false) {
  const db = await superCtx();
  const clean = name.trim().slice(0, 40);
  if (!clean) return;
  const { data: maxRows } = await db
    .from("complaint_categories")
    .select("sort_order")
    .eq("institution_id", institutionId)
    .order("sort_order", { ascending: false })
    .limit(1);
  await db.from("complaint_categories").insert({
    institution_id: institutionId,
    name: clean,
    is_mess: isMess,
    sort_order: ((maxRows ?? [])[0]?.sort_order ?? 0) + 10,
    is_active: true,
  });
  revalidatePath("/admin");
}

export async function updateCategory(
  institutionId: string,
  id: string,
  data: { name?: string; is_active?: boolean; is_mess?: boolean },
) {
  const db = await superCtx();
  await db
    .from("complaint_categories")
    .update(data)
    .eq("institution_id", institutionId)
    .eq("id", id);
  revalidatePath("/admin");
}

export async function deleteCategory(institutionId: string, id: string) {
  const db = await superCtx();
  await db
    .from("complaint_categories")
    .delete()
    .eq("institution_id", institutionId)
    .eq("id", id);
  revalidatePath("/admin");
}