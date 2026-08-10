"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  ChevronLeft,
  Flag,
  Pin,
  Trash2,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/client";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import type { Category, Comment, Complaint, Mess } from "@/lib/types";

export default function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [mess, setMess] = useState<Mess | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [upvoted, setUpvoted] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setMyId(user?.id ?? null);

      const [c, cm, up] = await Promise.all([
        supabase
          .from("complaints")
          .select("*, complaint_author, complaint_author_roll")
          .eq("id", id)
          .single(),
        supabase
          .from("complaint_comments")
          .select("*, comment_author")
          .eq("complaint_id", id)
          .eq("is_deleted", false)
          .order("created_at"),
        supabase.rpc("my_upvoted_complaint_ids"),
      ]);
      if (cancelled) return;

      setComplaint(c.data);
      setComments(c.data ? (cm.data ?? []) : []);
      if (c.data?.category_id) {
        supabase
          .from("complaint_categories")
          .select("*")
          .eq("id", c.data.category_id)
          .single()
          .then(({ data }) => !cancelled && setCategory(data));
      }
      if (c.data?.mess_id) {
        supabase
          .from("messes")
          .select("*")
          .eq("id", c.data.mess_id)
          .single()
          .then(({ data }) => !cancelled && setMess(data));
      }
      const ids = new Set((up.data ?? []).map((r: { complaint_id: string }) => r.complaint_id));
      setUpvoted(ids.has(id));
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!myId) return;
    const supabase = createClient();
    supabase.rpc("my_complaints").then(({ data }) => {
      setShowDelete((data ?? []).some((c: { id: string }) => c.id === id));
    });
  }, [myId, id]);

  async function toggleUpvote() {
    if (!myId) return;
    const supabase = createClient();
    if (upvoted) {
      const { error } = await supabase
        .from("complaint_upvotes")
        .delete()
        .eq("complaint_id", id)
        .eq("user_id", myId);
      if (!error) {
        setUpvoted(false);
        setComplaint((c) => (c ? { ...c, upvote_count: Math.max(c.upvote_count - 1, 0) } : c));
      }
    } else {
      const { error } = await supabase
        .from("complaint_upvotes")
        .insert({ complaint_id: id, user_id: myId });
      if (!error) {
        setUpvoted(true);
        setComplaint((c) => (c ? { ...c, upvote_count: c.upvote_count + 1 } : c));
      } else if (error.message.includes("violates")) {
        setActionMsg("You already upvoted this.");
      }
    }
  }

  async function addComment() {
    if (!newComment.trim() || !myId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("complaint_comments")
      .insert({ complaint_id: id, user_id: myId, body: newComment.trim() })
      .select()
      .single();
    if (!error && data) {
      setComments((prev) => [
        ...prev,
        { ...data, author_name: "You" },
      ]);
      setNewComment("");
    }
  }

  async function flagComplaint() {
    if (!myId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("complaint_flags")
      .insert({ complaint_id: id, user_id: myId });
    if (!error) {
      setActionMsg("Reported. Committee will review.");
    } else if (error.message.includes("violates")) {
      setActionMsg("You already reported this.");
    } else {
      setActionMsg(null);
      setError(error.message);
    }
  }

  async function deleteComplaint() {
    if (!confirm("Delete this complaint permanently?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("complaints").delete().eq("id", id);
    if (!error) {
      router.push("/complaints");
      router.refresh();
    } else {
      setError(error.message);
    }
  }

  if (!complaint) {
    return (
      <div className="mx-auto max-w-lg px-4">
        <NavBar />
        <p className="py-10 text-center text-sm text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <NavBar />
      <button
        onClick={() => router.back()}
        className="mb-3 flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <ChevronLeft className="h-4 w-4" /> All complaints
      </button>

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
          <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
            {complaint.photo_urls.map((u) => (
              <img
                key={u}
                src={u}
                alt="complaint evidence"
                className="h-28 w-28 shrink-0 rounded-lg object-cover ring-1 ring-zinc-100 dark:ring-zinc-800"
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

        <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <button
            onClick={toggleUpvote}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              upvoted
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            <ArrowUp className={`h-4 w-4 ${upvoted ? "" : ""}`} />
            {complaint.upvote_count}
          </button>
          <button
            onClick={flagComplaint}
            className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-red-500"
          >
            <Flag className="h-3.5 w-3.5" /> Report
          </button>
          {showDelete && (
            <button
              onClick={deleteComplaint}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-400 transition hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>

        {actionMsg && <p className="mt-2 text-xs text-emerald-600">{actionMsg}</p>}
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
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

      <div className="mt-3 flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={500}
          placeholder="Add a comment…"
          className="input flex-1"
        />
        <button
          onClick={addComment}
          disabled={!newComment.trim()}
          className="btn-primary px-4 text-xs disabled:opacity-40"
        >
          Post
        </button>
      </div>
      <div className="h-4" />
    </div>
  );
}
