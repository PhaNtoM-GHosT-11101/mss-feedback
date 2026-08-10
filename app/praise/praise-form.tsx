"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PraiseForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sign in first.");
      setBusy(false);
      return;
    }
    const { error: err } = await supabase.from("praises").insert({
      user_id: user.id,
      text: text.trim().slice(0, 280),
      is_anonymous: anon,
      created_at: new Date().toISOString(),
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setText("");
    setAnon(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mt-4 p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 280))}
        rows={2}
        placeholder="What did the kitchen do well today?"
        className="input w-full resize-none"
      />
      <div className="mt-2.5 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={anon}
            onChange={(e) => setAnon(e.target.checked)}
            className="h-3.5 w-3.5 accent-zinc-900 dark:accent-white"
          />
          Post anonymously
        </label>
        <button type="submit" disabled={busy || !text.trim()} className="btn-accent flex items-center gap-1.5 px-3.5 py-2 text-xs">
          <Send className="h-3.5 w-3.5" /> {busy ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </form>
  );
}
