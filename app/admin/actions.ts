"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";

async function adminDb() {
  await getCommittee();
  return createAdminClient();
}

async function adminDbAsAdmin() {
  const { isAdmin } = await getCommittee();
  if (!isAdmin) throw new Error("Admin only");
  return createAdminClient();
}

// ---------- Complaints ----------

export async function setComplaintStatus(
  id: string,
  status: "new" | "in_progress" | "resolved",
  note?: string,
) {
  const db = await adminDb();
  await db
    .from("complaints")
    .update({
      status,
      closed_by: status === "resolved" ? "committee" : undefined,
      resolution_note: status === "resolved" ? (note?.trim() || null) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/admin/complaints");
}

export async function togglePin(id: string, pinned: boolean) {
  const db = await adminDb();
  await db.from("complaints").update({ is_pinned: pinned }).eq("id", id);
  revalidatePath("/admin/complaints");
}

export async function deleteComplaint(id: string) {
  const db = await adminDb();
  await db.from("complaints").delete().eq("id", id);
  revalidatePath("/admin/complaints");
}

export async function removeUpvote(complaintId: string, userId: string) {
  const db = await adminDb();
  await db
    .from("complaint_upvotes")
    .delete()
    .eq("complaint_id", complaintId)
    .eq("user_id", userId);
  revalidatePath("/admin/complaints");
}

export async function clearFlag(id: string) {
  const db = await adminDb();
  await db
    .from("complaints")
    .update({ is_flagged: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/complaints");
}

export async function deleteRating(id: string) {
  const db = await adminDb();
  await db.from("ratings").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function deletePraise(id: string) {
  const db = await adminDb();
  await db.from("praises").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function deleteComment(id: string) {
  const db = await adminDb();
  await db
    .from("complaint_comments")
    .update({ is_deleted: true })
    .eq("id", id);
  revalidatePath("/admin/complaints");
}

// ---------- Users ----------

export async function setUserBanned(userId: string, banned: boolean) {
  const db = await adminDbAsAdmin();
  await db.from("profiles").update({ is_banned: banned }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const db = await adminDbAsAdmin();
  await db.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
}

export async function updateUserProfile(
  userId: string,
  data: { roll_no?: string | null; mess_id?: string | null; full_name?: string },
) {
  const db = await adminDbAsAdmin();
  await db.from("profiles").update(data).eq("id", userId);
  revalidatePath("/admin/users");
}

// ---------- Roles ----------

export async function addCommitteeMember(
  email: string,
  role: "committee" | "admin",
  messId: string | null = null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await adminDbAsAdmin();
  const { data: userList, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return { ok: false, error: "Could not load users. Try again." };
  const match = userList?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!match) return { ok: false, error: "No user with that email — they must sign in to the app once first." };
  if (role === "admin" && messId) {
    return { ok: false, error: "Super admins manage all messes — no mess scope." };
  }
  await db.from("admin_members").upsert({ user_id: match.id, role, mess_id: messId || null });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function removeCommitteeMember(userId: string) {
  const db = await adminDbAsAdmin();
  await db.from("admin_members").delete().eq("user_id", userId);
  revalidatePath("/admin/settings");
}

// ---------- Settings ----------

export async function saveCategories(cats: { id?: string; name: string; sort_order: number; is_active: boolean }[]) {
  const db = await adminDb();
  for (const c of cats) {
    if (c.id) {
      await db.from("complaint_categories").update(c).eq("id", c.id);
    } else {
      await db.from("complaint_categories").insert(c);
    }
  }
  revalidatePath("/admin/settings");
}

export async function deleteCategory(id: string) {
  const db = await adminDb();
  await db.from("complaint_categories").delete().eq("id", id);
  revalidatePath("/admin/settings");
}

export async function saveMeals(meals: { id?: string; name: string; start_hour: number; end_hour: number; sort_order: number; is_active: boolean }[]) {
  const db = await adminDb();
  for (const m of meals) {
    if (m.id) {
      await db.from("meals").update(m).eq("id", m.id);
    } else {
      await db.from("meals").insert(m);
    }
  }
  revalidatePath("/admin/settings");
}

export async function deleteMeal(id: string) {
  const db = await adminDb();
  await db.from("meals").delete().eq("id", id);
  revalidatePath("/admin/settings");
}

export async function saveMesses(messes: { id?: string; name: string; is_active: boolean; mess_type?: string }[]) {
  const db = await adminDb();
  for (const m of messes) {
    if (m.id) {
      await db.from("messes").update(m).eq("id", m.id);
    } else {
      await db.from("messes").insert(m);
    }
  }
  revalidatePath("/admin/settings");
}

export async function deleteMess(id: string) {
  const db = await adminDb();
  await db.from("messes").delete().eq("id", id);
  revalidatePath("/admin/settings");
}

export async function saveGeneralSettings(data: {
  daily_complaint_limit: number;
  digest_emails: string[];
  weekly_report_emails: string[];
}) {
  const db = await adminDb();
  await db
    .from("settings")
    .update({ value: data })
    .eq("key", "general");
  revalidatePath("/admin/settings");
}

// ---------- Menu & Announcements ----------

export async function saveMenuItems(
  items: { id?: string; meal_id: string; item_text: string; menu_date: string | null; weekday: number | null; is_template: boolean; mess_id?: string | null }[],
) {
  const db = await adminDb();
  for (const it of items) {
    if (it.id) {
      await db.from("menu_items").update(it).eq("id", it.id);
    } else {
      await db.from("menu_items").insert(it);
    }
  }
  revalidatePath("/admin/menu");
}

export async function setMessMealActive(messId: string, mealId: string, isActive: boolean) {
  const db = await adminDb();
  await db
    .from("mess_meal_settings")
    .upsert({ mess_id: messId, meal_id: mealId, is_active: isActive }, { onConflict: "mess_id,meal_id" });
  revalidatePath("/admin/menu");
  revalidatePath("/");
}

export async function deleteMenuItem(id: string) {
  const db = await adminDb();
  await db.from("menu_items").delete().eq("id", id);
  revalidatePath("/admin/menu");
}

export async function postAnnouncement(title: string, body: string) {
  const db = await adminDb();
  const { user } = await getCommittee();
  await db.from("announcements").insert({ title, body, created_by: user.id });
  revalidatePath("/admin/menu");
}

export async function deleteAnnouncement(id: string) {
  const db = await adminDb();
  await db.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/menu");
}
