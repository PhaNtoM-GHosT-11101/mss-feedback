"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="mx-auto max-w-3xl px-4">
      <NavBar />
      <h1 className="text-lg font-semibold">Praise wall 👏</h1>
      <p className="mt-1 text-sm text-gray-500">
        Thank the mess staff for a great meal or hard work.
      </p>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="e.g. Great breakfast today, chai was perfect!"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
        />
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-gray-500">
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
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            {saving ? "Posting…" : "Post praise"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      <div className="mt-4 space-y-2">
        {praises.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-gray-200 bg-white p-3.5 text-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <p>{p.text}</p>
            <p className="mt-1 text-xs text-gray-400">
              {p.is_anonymous || !p.praise_author ? "Anonymous" : p.praise_author} ·{" "}
              {timeAgo(p.created_at)}
            </p>
          </div>
        ))}
        {praises.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
            No praise yet — be the first!
          </p>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}
