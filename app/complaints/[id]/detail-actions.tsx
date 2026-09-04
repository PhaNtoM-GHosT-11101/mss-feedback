"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { revalidateComplaint } from "./actions";
import { ArrowUp, Flag, Trash2 } from "lucide-react";
import { IconCheck, IconWhatsApp } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export function CloseComplaint({ complaintId, title }: { complaintId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function close() {
    if (busy || done) return;
    if (!confirm(`Mark "${title.slice(0, 60)}" as resolved? It will be closed on your side.`)) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("close_own_complaint", { complaint_id: complaintId });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    await revalidateComplaint();
    router.refresh();
  }

  return (
    <button
      onClick={close}
      disabled={busy || done}
      className="btn-primary tap flex items-center gap-1.5 px-3.5 py-1.5 text-xs disabled:opacity-50"
    >
      <IconCheck className="h-3.5 w-3.5" />
      {done ? "Marked resolved" : busy ? "Closing…" : "Mark resolved"}
      {error && <span className="ml-1 text-[10px] font-normal text-red-500">{error}</span>}
    </button>
  );
}

export function WhatsAppShare({ title }: { title: string }) {
  return (
    <button
      onClick={() => {
        const text = encodeURIComponent(`Campus Feedback — ${title}:\n${window.location.href}`);
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
      }}
      className="tap flex items-center gap-1.5 rounded-full border border-border bg-surface2 px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-border"
    >
      <IconWhatsApp className="h-3.5 w-3.5 text-[#25D366]" /> Share
    </button>
  );
}

export function VoteBar({ complaintId, upvotes }: { complaintId: string; upvotes: number }) {
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState(false);
  const [count, setCount] = useState(upvotes);
  const [canDelete, setCanDelete] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setMyId(data.user?.id ?? null);
      if (!data.user) return;
      supabase.rpc("my_upvoted_complaint_ids").then(({ data: ids }) => {
        setUpvoted((ids ?? []).some((r: { complaint_id: string }) => r.complaint_id === complaintId));
      });
      supabase.rpc("my_complaints").then(({ data }) => {
        setCanDelete((data ?? []).some((c: { id: string }) => c.id === complaintId));
      });
    });
  }, [complaintId]);

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
      } else if (error.message.includes("violates")) {
        setActionMsg("You already upvoted this.");
      }
    }
  }

  async function flagComplaint() {
    if (!myId) return;
    const supabase = createClient();
    const { error } = await supabase.from("complaint_flags").insert({ complaint_id: complaintId, user_id: myId });
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
    if (!myId || !confirm("Delete this complaint permanently?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("complaints").delete().eq("id", complaintId);
    if (!error) {
      await revalidateComplaint();
      router.push("/complaints");
      router.refresh();
    } else {
      setError(error.message);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <button
          onClick={toggleUpvote}
          className={`tap flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            upvoted
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          }`}
        >
          <ArrowUp className="h-4 w-4" />
          {count}
        </button>
        <button
          onClick={flagComplaint}
          className="tap ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-red-500"
        >
          <Flag className="h-3.5 w-3.5" /> Report
        </button>
        {canDelete && (
          <button
            onClick={deleteComplaint}
            className="tap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-400 transition hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
      {actionMsg && <p className="mt-2 text-xs text-emerald-600">{actionMsg}</p>}
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
        <button onClick={post} disabled={!text.trim() || busy} className="btn-primary tap px-4 text-xs disabled:opacity-40">
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
      {posted && !failed && (
        <div className="card mt-2 p-3 text-sm opacity-90">
          <p>{posted}</p>
          <p className="mt-1 text-xs text-zinc-400">You · just now</p>
        </div>
      )}
      {failed && <p className="mt-2 text-xs text-red-500">Comment not posted. Please try again.</p>}
    </div>
  );
}