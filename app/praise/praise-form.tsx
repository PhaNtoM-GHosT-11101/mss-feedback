"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconPraise, IconCheck } from "@/components/icons";

const CONFETTI_COLORS = ["#E8A020", "#3E6B4F", "#6B4A78", "#D95B43", "#4E7A8C"];

export default function PraiseForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [posted, setPosted] = useState<string | null>(null);
  const [postedAnon, setPostedAnon] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confetti, setConfetti] = useState<number[]>([]);
  const ticketRef = useRef<HTMLDivElement>(null);

  function burst() {
    const pieces = Array.from({ length: 18 }, (_, i) => i);
    setConfetti(pieces);
    window.setTimeout(() => setConfetti([]), 1300);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    const optimistic = text.trim().slice(0, 280);
    const optimisticAnon = anon;
    setBusy(true);
    setError("");
    setFailed(false);
    setPosted(optimistic);
    setPostedAnon(optimisticAnon);
    setText("");
    setAnon(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFailed(true);
      setError("Sign in first.");
      setText(optimistic);
      setAnon(optimisticAnon);
      setPosted(null);
      setBusy(false);
      return;
    }
    const { error: err } = await supabase.from("praises").insert({
      user_id: user.id,
      text: optimistic,
      is_anonymous: optimisticAnon,
      created_at: new Date().toISOString(),
    });
    setBusy(false);
    if (err) {
      setFailed(true);
      setError(err.message);
      setText(optimistic);
      setAnon(optimisticAnon);
      setPosted(null);
      return;
    }
    burst();
    window.setTimeout(() => {
      setPosted(null);
      router.refresh();
    }, 900);
  }

  return (
    <div>
      <form onSubmit={submit} className="card mt-4 p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          rows={2}
          placeholder="What did the kitchen do well today?"
          className="input w-full resize-none"
        />
        <div className="mt-2.5 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={anon}
              onChange={(e) => setAnon(e.target.checked)}
              className="h-3.5 w-3.5 accent-[--accent]"
            />
            Post anonymously
          </label>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="btn btn-accent tap flex items-center gap-1.5 px-3.5 py-2 text-xs"
          >
            <IconPraise className="h-3.5 w-3.5" />
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </form>

      {posted && !failed && (
        <div ref={ticketRef} className="ticket mt-3 opacity-95 relative">
          {confetti.map((i) => (
            <span
              key={i}
              className="confetti"
              style={{
                left: `${8 + ((i * 37) % 84)}%`,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 5) * 0.06}s`,
              }}
            />
          ))}
          <div className="ticket-strip">
            <IconPraise className="h-4 w-4 text-[--accent]" />
            <span className="section-label !text-[10px]">Praise ticket</span>
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[--sage]">
              <IconCheck className="h-3 w-3" /> issued
            </span>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-sm leading-relaxed">{posted}</p>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-border px-4 py-2">
            <span className="text-[10px] font-medium text-muted">
              {postedAnon ? "Anonymous" : "You"} · just now
            </span>
            <span className="ticket-barcode" />
          </div>
        </div>
      )}
    </div>
  );
}
