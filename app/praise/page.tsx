"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Send } from "lucide-react";
import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";
import type { Praise } from "@/lib/types";

export default function PraisePage() {
  const router = useRouter();
  const [praises, setPraises] = useState<Praise[]>([]);
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("praises")
      .select("*, praise_author")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setPraises(data ?? []));
  }, []);

  async function submit() {
    if (text.trim().length < 2) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("praises").insert({
      text: text.trim(),
      is_anonymous: anonymous,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setText("");
    setAnonymous(false);
    router.refresh();
    supabase
      .from("praises")
      .select("*, praise_author")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setPraises(data ?? []));
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <NavBar />
      <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <PartyPopper className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        Praise wall
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Thank the mess staff for a great meal or hard work.
      </p>

      <div className="card mt-4 p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="e.g. Great breakfast today, chai was perfect!"
          className="input resize-none"
        />
        <div className="mt-2.5 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-3.5 w-3.5 accent-emerald-600"
            />
            Post anonymously
          </label>
          <button
            onClick={submit}
            disabled={saving || text.trim().length < 2}
            className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            {saving ? "Posting…" : "Post praise"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      <div className="mt-4 space-y-2">
        {praises.map((p) => (
          <div key={p.id} className="card p-3.5 text-sm">
            <p>{p.text}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {p.is_anonymous || !p.praise_author ? "Anonymous" : p.praise_author} ·{" "}
              {timeAgo(p.created_at)}
            </p>
          </div>
        ))}
        {praises.length === 0 && (
          <p className="card border-dashed p-6 text-center text-sm text-zinc-400">
            No praise yet — be the first!
          </p>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}
