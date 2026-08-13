import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { ChevronLeft, Pin } from "lucide-react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { VoteBar, CommentForm, CloseComplaint, WhatsAppShare } from "./detail-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import type { Category, Comment, Complaint, Mess } from "@/lib/types";

export const revalidate = 30;

const getData = unstable_cache(
  async (id: string) => {
    const db = createAdminClient();
    const [c, cm] = await Promise.all([
      db
        .from("complaints")
        .select("*, complaint_author, complaint_author_roll")
        .eq("id", id)
        .single(),
      db
        .from("complaint_comments")
        .select("*, comment_author")
        .eq("complaint_id", id)
        .eq("is_deleted", false)
        .order("created_at"),
    ]);
    if (!c.data) return null;
    const [cat, mess] = await Promise.all([
      c.data.category_id
        ? db.from("complaint_categories").select("*").eq("id", c.data.category_id).single()
        : Promise.resolve({ data: null }),
      c.data.mess_id
        ? db.from("messes").select("*").eq("id", c.data.mess_id).single()
        : Promise.resolve({ data: null }),
    ]);
    return {
      complaint: c.data as unknown as Complaint,
      comments: (cm.data ?? []) as unknown as Comment[],
      category: (cat.data ?? null) as unknown as Category | null,
      mess: (mess.data ?? null) as unknown as Mess | null,
    };
  },
  ["complaint"],
  { revalidate: 30, tags: ["complaint"] },
);

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { complaint, comments, category, mess } = data;
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  const isOwner = !!user && complaint.user_id === user.id;
  const isResolved = complaint.status === "resolved";

  return (
    <div className="mx-auto max-w-2xl px-4">
      <NavBar />
      <Link
        href="/complaints"
        className="mb-3 flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <ChevronLeft className="h-4 w-4" /> All complaints
      </Link>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {complaint.is_pinned && <Pin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor(complaint.status)}`}>
            {statusLabel(complaint.status)}
          </span>
          {category && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {category.name}
            </span>
          )}
          {mess && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {mess.name}
            </span>
          )}
        </div>

        <h1 className="mt-2.5 text-lg font-semibold tracking-tight">{complaint.title}</h1>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {complaint.description}
        </p>

        {complaint.photo_urls.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {complaint.photo_urls.map((u) => (
              <img
                key={u}
                src={u}
                alt="complaint evidence"
                loading="lazy"
                className="aspect-square h-28 w-28 shrink-0 rounded-lg object-cover ring-1 ring-zinc-100 dark:ring-zinc-800"
              />
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            {complaint.is_anonymous || !complaint.complaint_author
              ? "Anonymous"
              : `${complaint.complaint_author}${complaint.complaint_author_roll ? ` (${complaint.complaint_author_roll})` : ""}`}
          </span>
          <span>·</span>
          <span>{timeAgo(complaint.created_at)}</span>
        </div>

        {complaint.status === "resolved" && complaint.resolution_note && (
          <div className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="font-semibold">Resolved:</span> {complaint.resolution_note}
          </div>
        )}

        <VoteBar complaintId={id} upvotes={complaint.upvote_count} />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isOwner && !isResolved && <CloseComplaint complaintId={id} title={complaint.title} />}
          <WhatsAppShare title={complaint.title} />
        </div>

        <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <CommentForm complaintId={id} />
        </div>
      </div>

      <h2 className="section-label mb-3 mt-8">Comments ({comments.length})</h2>
      <div className="space-y-2">
        {comments.map((cm) => (
          <div key={cm.id} className="card p-3 text-sm">
            <p>{cm.body}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {cm.comment_author ?? "Unknown"} · {timeAgo(cm.created_at)}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="card border-dashed p-5 text-center text-sm text-zinc-400">
            No comments yet.
          </p>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}