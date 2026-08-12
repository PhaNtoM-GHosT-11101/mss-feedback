"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Mess, Profile } from "@/lib/types";

export default function OnboardPage() {
  const router = useRouter();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messId, setMessId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(prof);
      const { data: ms } = await supabase
        .from("messes")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setMesses(ms ?? []);
      if (ms?.length) setMessId(prof?.mess_id ?? ms[0].id);
    })();
  }, []);

  async function finish() {
    if (!profile || !messId) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ mess_id: messId, roll_no: rollNo.trim() || null })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-xs font-bold tracking-wide text-white dark:bg-white dark:text-zinc-900">
            MSS
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Welcome to MSS Feedback
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            One quick step to start rating meals and filing complaints.
          </p>
        </div>

        <div className="card space-y-4 p-5">
          <div>
            <label className="section-label">Your mess</label>
            <select
              value={messId}
              onChange={(e) => setMessId(e.target.value)}
              className="input mt-1.5"
            >
              {messes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="section-label">Roll number (optional)</label>
            <input
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g. 23CSB01"
              className="input mt-1.5"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={finish}
            disabled={saving || !messId}
            className="btn-primary flex w-full items-center justify-center gap-1.5 py-3 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Let's go"}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
