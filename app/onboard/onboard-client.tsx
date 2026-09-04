"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Mess } from "@/lib/types";

export default function OnboardClient({
  institutionName,
  institutionSlug,
  messes,
  existingMessId,
  existingRoll,
}: {
  institutionName: string;
  institutionSlug: string;
  messes: Mess[];
  existingMessId: string | null;
  existingRoll: string | null;
}) {
  const router = useRouter();
  const [messId, setMessId] = useState(existingMessId ?? messes[0]?.id ?? "");
  const [rollNo, setRollNo] = useState(existingRoll ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    if (!messId) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Not signed in.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ mess_id: messId, roll_no: rollNo.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/${institutionSlug}`);
    router.refresh();
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#F0AE3C] to-[#E8A020] text-[#241A04]">
            <span className="font-display text-sm font-bold">M</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{institutionName}</h1>
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
