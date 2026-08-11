import { createAdminClient } from "@/lib/supabase/admin";
import { getCommittee } from "@/lib/admin-guard";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import SortToggle from "./sort-toggle";
import {
  setComplaintStatus,
  togglePin,
  deleteComplaint,
  clearFlag,
  deleteComment,
  removeUpvote,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  await getCommittee();
  const db = createAdminClient();
  const sp = await searchParams;
  const sort = sp.sort === "latest" ? "latest" : "upvotes";

  const complaintsQuery = db
    .from("complaints")
    .select("*, profiles!complaints_user_id_fkey(full_name, roll_no)")
    .order("created_at", { ascending: false });
  if (sort === "upvotes") complaintsQuery.order("upvote_count", { ascending: false });

  const [complaints, upvotes, comments, flags] = await Promise.all([
    complaintsQuery.limit(200),
    db
      .from("complaint_upvotes")
      .select("complaint_id, user_id, profiles!complaint_upvotes_user_id_fkey(full_name)")
      .limit(500),
    db
      .from("complaint_comments")
      .select("*, profiles!complaint_comments_user_id_fkey(full_name)")
      .eq("is_deleted", false)
      .order("created_at")
      .limit(500),
    db.from("complaint_flags").select("complaint_id, profiles!complaint_flags_user_id_fkey(full_name)").limit(500),
  ]);

  const upvotesBy = new Map<string, { user_id: string; full_name: string | null }[]>();
  for (const u of upvotes.data ?? []) {
    const list = upvotesBy.get(u.complaint_id) ?? [];
    const p = u.profiles as unknown as { full_name: string | null } | { full_name: string | null }[] | null;
    list.push({ user_id: u.user_id, full_name: (Array.isArray(p) ? p[0]?.full_name : p?.full_name) ?? null });
    upvotesBy.set(u.complaint_id, list);
  }
  const commentsBy = new Map<string, typeof comments.data>();
  for (const c of comments.data ?? []) {
    const list = commentsBy.get(c.complaint_id) ?? [];
    list.push(c);
    commentsBy.set(c.complaint_id, list);
  }
  const flagsBy = new Map<string, { full_name: string | null }[]>();
  for (const f of flags.data ?? []) {
    const list = flagsBy.get(f.complaint_id) ?? [];
    list.push(f.profiles as unknown as { full_name: string | null });
    flagsBy.set(f.complaint_id, list);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Complaints</h1>
        <SortToggle current={sort} />
      </div>

      <div className="mt-4 space-y-3">
        {(complaints.data ?? []).map((c) => {
          const cm = commentsBy.get(c.id) ?? [];
          const up = upvotesBy.get(c.id) ?? [];
          const fl = flagsBy.get(c.id) ?? [];
          return (
            <div
              key={c.id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-wrap items-center gap-2">
                {c.is_flagged && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950 dark:text-red-400">
                    🚩 FLAGGED
                  </span>
                )}
                {c.is_pinned && <span className="text-xs">📌</span>}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor(c.status)}`}>
                  {statusLabel(c.status)}
                </span>
                <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
              </div>

              <h2 className="mt-2 font-medium">{c.title}</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{c.description}</p>

              <p className="mt-2 text-xs text-gray-400">
                By: {c.is_anonymous ? "🙈 Anonymous — " : ""}
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {(c.profiles as { full_name: string; roll_no: string | null } | null)?.full_name ?? "?"}
                </span>
                {c.profiles && (
                  <span>{" ("}{(c.profiles as { roll_no: string | null }).roll_no ?? "no roll no"}{")"}</span>
                )}
                {c.photo_urls.length > 0 && ` · 📷 ${c.photo_urls.length} photo${c.photo_urls.length > 1 ? "s" : ""}`}
              </p>

              {c.status === "resolved" && c.resolution_note && (
                <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <b>Resolved:</b> {c.resolution_note}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                <form action={async () => { "use server"; await setComplaintStatus(c.id, "in_progress"); }}>
                  <button className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400">In progress</button>
                </form>
                <form action={async () => { "use server"; await setComplaintStatus(c.id, "resolved", c.resolution_note ?? undefined); }}>
                  <button className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">Mark resolved</button>
                </form>
                <form action={async () => { "use server"; await togglePin(c.id, !c.is_pinned); }}>
                  <button className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300">{c.is_pinned ? "Unpin" : "Pin"}</button>
                </form>
                {c.is_flagged && (
                  <form action={async () => { "use server"; await clearFlag(c.id); }}>
                    <button className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-400">Clear flag</button>
                  </form>
                )}
                <form action={async () => { "use server"; await deleteComplaint(c.id); }}>
                  <button className="ml-auto rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-950">Delete</button>
                </form>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-gray-400">Details (upvotes, flags, comments)</summary>
                <div className="mt-2 space-y-2 text-xs">
                  <p>
                    <b>▲ {c.upvote_count} upvotes:</b>{" "}
                    {up.map((u) => u.full_name).filter(Boolean).join(", ") || "none"}
                    {up.length > 0 && " · "}
                    <span className="text-gray-400">Remove:</span>{" "}
                    {up.slice(0, 5).map((u, i) => (
                      <form key={i} className="inline" action={async () => { "use server"; await removeUpvote(c.id, u.user_id); }}>
                        <button className="text-red-400 underline">x</button>
                      </form>
                    ))}
                  </p>
                  {fl.length > 0 && (
                    <p className="text-red-500">
                      <b>🚩 Flagged by:</b> {fl.map((f) => f.full_name).filter(Boolean).join(", ")}
                    </p>
                  )}
                  {cm.length > 0 && (
                    <div>
                      <b>Comments:</b>
                      <div className="mt-1 space-y-1">
                        {cm.map((cc) => (
                          <div key={cc.id} className="flex items-start justify-between gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                            <span>
                              <b>{(cc.profiles as { full_name: string } | null)?.full_name}:</b> {cc.body}
                            </span>
                            <form action={async () => { "use server"; await deleteComment(cc.id); }}>
                              <button className="text-red-400">delete</button>
                            </form>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          );
        })}
        {(complaints.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
            No complaints yet.
          </p>
        )}
      </div>
    </div>
  );
}
