import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { ChevronLeft, Pin } from "lucide-react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { VoteBar, CommentForm, WhatsAppShare } from "./detail-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { requireInstitution } from "@/lib/institution";
import { timeAgo } from "@/lib/format";
import type { Category, Comment, Complaint } from "@/lib/types";

export const revalidate = 30;

const getData = unstable_cache(
  async (id: string, institutionId: string) => {
    const db = createAdminClient();
    const [c, cm] = await Promise.all([
      db
        .from("complaints")
        .select("*, complaint_author, complaint_author_roll")
        .eq("id", id)
        .eq("institution_id", institutionId)
        .eq("is_flagged", false)
        .single(),
      db
        .from("complaint_comments")
        .select("*, comment_author")
        .eq("complaint_id", id)
        .eq("institution_id", institutionId)
        .eq("is_deleted", false)
        .order("created_at"),
    ]);
    if (!c.data) return null;
    const catData = c.data.category_id
      ? (
          await db
            .from("complaint_categories")
            .select("*")
            .eq("id", c.data.category_id)
            .eq("institution_id", institutionId)
            .single()
        ).data
      : null;
    return {
      complaint: c.data as unknown as Complaint,
      comments: (cm.data ?? []) as unknown as Comment[],
      category: (catData ?? null) as unknown as Category | null,
    };
  },
  ["complaint"],
  { revalidate: 30, tags: ["complaint"] },
);

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const institution = await requireInstitution();
  const data = await getData(id, institution.id);
  if (!data) notFound();
  const { complaint, comments, category } = data;
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  const isOwner = !!user && complaint.user_id === user.id;

  const isAnonymous = complaint.is_anonymous || !complaint.complaint_author;
  const authorName = isAnonymous
    ? "Anonymous"
    : complaint.complaint_author ?? "Unknown";
  const authorRoll = complaint.complaint_author_roll;

  return (
    <div className="md:ml-60">
      <NavBar institutionName={institution.name} tagline={institution.tagline} />

      <main className="mx-auto max-w-2xl px-4 pb-10 pt-4">
        <Link
          href={`/${institution.slug}`}
          className="tap mb-3 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[13px] font-medium text-zinc-500 transition hover:bg-surface2 hover:text-foreground dark:text-zinc-400"
        >
          <ChevronLeft className="h-4 w-4" /> {institution.name}&apos;s board
        </Link>

        <article className="card p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {category && (
              <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-accent-ink">
                {category.is_mess ? "🍽 " : ""}
                {category.name}
              </span>
            )}
            {complaint.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Pin className="h-3.5 w-3.5" /> Pinned
              </span>
            )}
          </div>

          <h1 className="mt-2.5 text-xl font-bold leading-snug tracking-tight">
            {complaint.title}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-[12.5px] text-zinc-500 dark:text-zinc-400">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                isAnonymous
                  ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300"
                  : "bg-accent text-white"
              }`}
            >
              {initialsFor(authorName)}
            </span>
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              {authorName}
              {authorRoll ? ` · ${authorRoll}` : ""}
            </span>
            <span aria-hidden>·</span>
            <span>{timeAgo(complaint.created_at)}</span>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-200">
            {complaint.description}
          </p>

          {complaint.photo_urls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {complaint.photo_urls.map((u) => (
                <img
                  key={u}
                  src={u}
                  alt="complaint evidence"
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover ring-1 ring-border"
                />
              ))}
            </div>
          )}

          <VoteBar
            isOwner={isOwner}
            complaintId={id}
            upvotes={complaint.upvote_count}
            returnTo={`/${institution.slug}`}
          />

          <div className="mt-3 border-t border-border pt-3">
            <CommentForm complaintId={id} />
          </div>
        </article>

        <h2 className="section-label mt-7 mb-3">Comments ({comments.length})</h2>
        <div className="space-y-2">
          {comments.map((cm) => {
            const cAuthor = cm.comment_author ?? "Unknown";
            return (
              <div key={cm.id} className="card flex items-start gap-2.5 p-3.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {initialsFor(cAuthor) || "?"}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">{cAuthor}</span>
                    <span className="text-zinc-400 dark:text-zinc-500">{timeAgo(cm.created_at)}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                    {cm.body}
                  </p>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && (
            <p className="card border-dashed p-5 text-center text-sm text-muted">
              No comments yet. Start the conversation below.
            </p>
          )}
        </div>

        <div className="mt-4">
          <WhatsAppShare title={complaint.title} />
        </div>
      </main>
    </div>
  );
}