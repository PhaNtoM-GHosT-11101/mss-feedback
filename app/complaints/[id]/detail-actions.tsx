"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { revalidateComplaint } from "./actions";
import { ArrowUp, Trash2 } from "lucide-react";
import { IconWhatsApp } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export function WhatsAppShare({ title }: { title: string }) {
  return (
    <button
      onClick={() => {
        const text = encodeURIComponent(`Campus Feedback — ${title}:\n${window.location.href}`);
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
      }}
      className="tap inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface2"
    >
      <IconWhatsApp className="h-3.5 w-3.5 text-[#25D366]" /> Share
    </button>
  );
}

export function VoteBar({
  complaintId,
  upvotes,
  isOwner,
  returnTo,
}: {
  complaintId: string;
  upvotes: number;
  isOwner: boolean;
  returnTo: string;
}) {
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState(false);
  const [count, setCount] = useState(upvotes);
  const [canDelete, setCanDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setMyId(data.user?.id ?? null);
      if (!data.user) return;
      supabase.rpc("my_upvoted_complaint_ids").then(({ data: ids }) => {
        setUpvoted((ids ?? []).some((r: { complaint_id: string }) => r.complaint_id === complaintId));
      });
      if (isOwner) {
        setCanDelete(true);
        return;
      }
      supabase.rpc("my_complaints").then(({ data }) => {
        setCanDelete((data ?? []).some((c: { id: string }) => c.id === complaintId));
      });
    });
  }, [complaintId, isOwner]);

  async function toggleUpvote() {
    if (!myId) return;
    const supabase = createClient();
    if (upvoted) {
      const { error } = await supabase
        .from("complaint_upvotes")
        .delete()
        .eq("complaint_id", complaintId);
      if (!error) {
        setUpvoted(false);
        setCount((n) => Math.max(n - 1, 0));
      }
    } else {
      const { error } = await supabase.from("complaint_upvotes").insert({ complaint_id: complaintId, user_id: myId });
      if (!error) {
        setUpvoted(true);
        setCount((n) => n + 1);
      }
    }
  }

  async function deleteComplaint() {
    if (!myId || !confirm("Delete this complaint permanently?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("complaints").delete().eq("id", complaintId);
    if (!error) {
      await revalidateComplaint();
      router.push(returnTo);
      router.refresh();
    } else {
      setError(error.message);
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleUpvote}
          disabled={!myId}
          className={`tap inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold tabular-nums transition ${
            upvoted
              ? "border-accent bg-accent text-white shadow-[0_2px_8px_-3px_rgb(255_69_0/0.5)]"
              : "border-border bg-surface text-zinc-600 hover:border-zinc-400 dark:text-zinc-200"
          } ${!myId ? "opacity-50" : ""}`}
          title={myId ? "Vote" : "Sign in to vote"}
        >
          <ArrowUp className={`h-4 w-4 ${upvoted ? "text-white" : ""}`} />
          {count}
        </button>
        {isOwner && canDelete && (
          <button
            onClick={deleteComplaint}
            className="tap inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/10 dark:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
        {!myId && (
          <a
            href="/login"
            className="ml-auto hidden text-xs font-medium text-muted transition hover:text-foreground sm:block"
          >
            Sign in to vote or comment
          </a>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function CommentForm({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [posted, setPosted] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  async function post() {
    if (!text.trim() || !myId || busy) return;
    const optimistic = text.trim();
    setBusy(true);
    setFailed(false);
    setPosted(optimistic);
    setText("");
    const supabase = createClient();
    const { error } = await supabase
      .from("complaint_comments")
      .insert({ complaint_id: complaintId, user_id: myId, body: optimistic });
    setBusy(false);
    if (error) {
      setFailed(true);
      setText(optimistic);
      setTimeout(() => setPosted(null), 60);
      return;
    }
    setPosted(null);
    await revalidateComplaint();
    router.refresh();
  }

  if (!myId) {
    return (
      <a
        href="/login"
        className="block rounded-xl border border-dashed border-border p-4 text-center text-[13px] font-medium text-muted transition hover:border-accent hover:text-foreground"
      >
        Sign in to join the conversation
      </a>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          onKeyDown={(e) => e.key === "Enter" && post()}
          placeholder="Add a comment…"
          className="input flex-1"
        />
        <button
          onClick={post}
          disabled={!text.trim() || busy}
          className="btn-primary tap px-4 text-xs disabled:opacity-40"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
      {posted && !failed && (
        <div className="card mt-2 p-3 text-sm opacity-90">
          <p>{posted}</p>
          <p className="mt-1 text-xs text-muted">You · just now</p>
        </div>
      )}
      {failed && <p className="mt-2 text-xs text-red-500">Comment not posted. Please try again.</p>}
    </div>
  );
}