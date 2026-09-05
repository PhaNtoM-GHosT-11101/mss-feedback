import { createAdminClient } from "@/lib/supabase/admin";
import { requireInstitution } from "@/lib/institution";
import ComplaintForm from "./complaint-form";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewComplaintPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; mess?: string }>;
}) {
  const sp = await searchParams;
  const institution = await requireInstitution();

  const db = createAdminClient();
  const { data } = await db
    .from("complaint_categories")
    .select("*")
    .eq("institution_id", institution.id)
    .eq("is_active", true)
    .order("sort_order");
  const categories = (data ?? []) as Category[];

  const isMess = sp.mess === "1";
  let initialCategoryId = sp.category && categories.some((c) => c.id === sp.category)
    ? sp.category
    : null;
  if (!initialCategoryId && isMess) {
    initialCategoryId = categories.find((c) => c.is_mess)?.id ?? null;
  }

  return (
    <ComplaintForm
      categories={categories}
      initialCategoryId={initialCategoryId}
      isMess={isMess}
    />
  );
}