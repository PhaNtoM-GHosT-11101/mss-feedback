"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { revalidateComplaint } from "./actions";
import { ArrowUp, Trash2, MessageSquarePlus } from "lucide-react";
import { IconWhatsApp } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";
import type { Comment } from "@/lib/types";

export function WhatsAppShare({ title }: { title: string }) {
  return (
    <button
      onClick={() => {
        const text = encodeURIComponent(`REVERB — ${title}:\n${window.location.href}`);
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
      }}
      className="tap inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface2"
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
      } else {
        setError(error.message);
      }
    } else {
      const { error } = await supabase.from("complaint_upvotes").insert({ complaint_id: complaintId, user_id: myId });
      if (!error) {
        setUpvoted(true);
        setCount((n) => n + 1);
      } else {
        setError(error.message);
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
    <div className="mt-5 flex items-center gap-2">
      <button
        onClick={toggleUpvote}
        disabled={!myId}
        className={`tap inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-bold tabular-nums transition ${
          upvoted
            ? "border-accent bg-accent text-white shadow-[0_2px_10px_-3px_rgb(79_70_229/0.6)]"
            : "border-border bg-surface text-zinc-600 hover:border-accent dark:text-zinc-200"
        } ${!myId ? "opacity-50" : ""}`}
        title={myId ? "Vote" : "Sign in to vote"}
      >
        <ArrowUp className={`h-4 w-4 ${upvoted ? "text-white" : ""}`} />
        {count}
      </button>
      {isOwner && canDelete && (
        <button
          onClick={deleteComplaint}
          className="tap inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/10 dark:text-red-400"
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
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function CommentForm({
  complaintId,
  parentId,
  placeholder = "Add a comment…",
  onPosted,
  autoFocus,
}: {
  complaintId: string;
  parentId?: string;
  placeholder?: string;
  onPosted?: () => void;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
    setText("");
    const supabase = createClient();
    const { error } = await supabase.from("complaint_comments").insert({
      complaint_id: complaintId,
      user_id: myId,
      body: optimistic,
      ...(parentId ? { parent_id: parentId } : {}),
    });
    setBusy(false);
    if (error) {
      setFailed(true);
      setText(optimistic);
      return;
    }
    await revalidateComplaint();
    router.refresh();
    onPosted?.();
  }

  if (!myId) {
    return (
      <a
        href="/login"
        className="block rounded-lg border border-dashed border-border p-4 text-center text-[13px] font-medium text-muted transition hover:border-accent hover:text-foreground"
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
          placeholder={placeholder}
          autoFocus={autoFocus}
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
      {failed && <p className="mt-2 text-xs text-red-500">Comment not posted. Please try again.</p>}
    </div>
  );
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function CommentThread({
  c,
  children,
  maxDepth,
}: {
  c: Comment;
  children?: ReactNode;
  maxDepth: number;
}) {
  const [replying, setReplying] = useState(false);
  const name = c.comment_author ?? "Unknown";
  return (
    <div>
      <div className="flex items-start gap-2.5 rounded-lg p-2.5 transition hover:bg-surface2/50">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-accent-soft text-[10px] font-bold text-accent-ink">
          {initialsFor(name) || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="font-semibold text-foreground">{name}</span>
            <span className="text-muted">{timeAgo(c.created_at)}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            {c.body}
          </p>
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="tap mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold text-muted transition hover:bg-surface2 hover:text-accent-ink"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Reply
          </button>
          {replying && (
            <div className="mt-2">
              <CommentForm
                complaintId={c.complaint_id}
                parentId={c.id}
                placeholder={`Reply to ${name}…`}
                autoFocus
                onPosted={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>
      {children && (
        <div
          className={
            maxDepth < 4
              ? "ml-4 mt-1 border-l border-border/70 pl-3 sm:ml-6"
              : "mt-1"
          }
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function ThreadedComments({ comments }: { comments: Comment[] }) {
  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Comment[]>();
    for (const c of comments) {
      const pid = c.parent_id ?? null;
      const arr = map.get(pid) ?? [];
      arr.push(c);
      map.set(pid, arr);
    }
    return map;
  }, [comments]);

  const render = (parentId: null | string, depth: number): ReactNode =>
    (childrenOf.get(parentId) ?? []).map((c) => (
      <CommentThread key={c.id} c={c} maxDepth={depth}>
        {render(c.id, depth + 1)}
      </CommentThread>
    ));

  return <div>{render(null, 0)}</div>;
}