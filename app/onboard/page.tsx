"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Mess, Profile } from "@/lib/types";

export default function OnboardPage() {
  const router = useRouter();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messId, setMessId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [saving, setSaving] = useState(false);

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
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ mess_id: messId, roll_no: rollNo.trim() || null })
      .eq("id", profile.id);
    setSaving(false);
    if (!error) {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-lg font-semibold">Welcome to MSS Feedback 👋</h1>
        <p className="mt-1 text-sm text-gray-500">
          One quick step to start rating meals and filing complaints.
        </p>

        <label className="mt-5 block text-xs font-medium text-gray-500">
          Your mess
        </label>
        <select
          value={messId}
          onChange={(e) => setMessId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
        >
          {messes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-xs font-medium text-gray-500">
          Roll number (optional)
        </label>
        <input
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          placeholder="e.g. 23CSB01"
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
        />

        <button
          onClick={finish}
          disabled={saving || !messId}
          className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Let's go"}
        </button>
      </div>
    </div>
  );
}
