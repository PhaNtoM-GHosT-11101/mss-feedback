import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { ChevronLeft, Pin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import {
  VoteBar,
  CommentForm,
  ThreadedComments,
  WhatsAppShare,
} from "./detail-actions";
import ReportButton from "@/components/ReportButton";
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
        .select("*, complaint_author, category:complaint_categories(*)")
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
    const complaint = c.data as unknown as Complaint & { category: Category | null };
    return {
      complaint,
      comments: (cm.data ?? []) as unknown as Comment[],
      category: complaint.category ?? null,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const institution = await requireInstitution();
  const data = await getData(id, institution.id);
  if (!data) return { title: "Complaint not found" };
  const title = data.complaint.title;
  const description = data.complaint.description?.slice(0, 200) ?? "";
  return {
    title: `${title} — Loud and sound`,
    description,
    openGraph: {
      title: `${title} — Loud and sound`,
      description,
      type: "article",
      siteName: "Loud and sound",
      url: `https://mss-feedback.vercel.app/${institution.slug}/complaints/${id}`,
      images: [{ url: "https://mss-feedback.vercel.app/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: { card: "summary", title: `${title} — Loud and sound`, description },
  };
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

  return (
    <div>
      <NavBar institutionName={institution.name} tagline={institution.tagline} />

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-2 md:px-6">
        <Link
          href={`/${institution.slug}`}
          className="tap mb-4 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[13px] font-medium text-muted transition hover:bg-surface2 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> {institution.name}&apos;s board
        </Link>

        <article>
          <div className="border-b border-border pb-5">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <span className="inline-flex items-center rounded-md bg-accent-soft px-2 py-0.5 text-[11.5px] font-semibold text-accent-ink">
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

            <h1 className="mt-2.5 text-[22px] font-bold leading-snug tracking-tight">
              {complaint.title}
            </h1>

            <div className="mt-3 flex items-center gap-x-1.5 gap-y-1 text-[12.5px] text-muted">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-[7px] text-[10px] font-bold ${
                  isAnonymous
                    ? "bg-surface2 text-muted"
                    : "bg-accent text-white"
                }`}
              >
                {initialsFor(authorName)}
              </span>
              <span className="font-medium text-foreground">{authorName}</span>
              <span aria-hidden>·</span>
              <span>{timeAgo(complaint.created_at)}</span>
              <span aria-hidden>·</span>
              <span>{institution.name}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-6 sm:flex-row">
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-200">
                {complaint.description}
              </p>

              {complaint.photo_urls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {complaint.photo_urls.map((u) => (
                    <Image
                      key={u}
                      src={u}
                      alt="complaint evidence"
                      width={800}
                      height={800}
                      sizes="(max-width: 640px) 50vw, 33vw"
                      loading="lazy"
                      quality={80}
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

              <div className="mt-6 border-t border-border pt-4">
                <CommentForm complaintId={id} />
              </div>
            </div>
          </div>
        </article>

        <div className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="section-label">Comments ({comments.length})</h2>
          </div>
          <div className="mt-3">
            {comments.length > 0 ? (
              <ThreadedComments comments={comments} />
            ) : (
              <div className="flex flex-col items-center border border-dashed border-border rounded-xl py-10 text-center">
                <p className="text-sm font-semibold text-foreground">No comments yet</p>
                <p className="mt-1 text-[13px] text-muted">Start the conversation below.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <WhatsAppShare title={complaint.title} />
          <ReportButton complaintId={id} />
        </div>
      </main>
    </div>
  );
}