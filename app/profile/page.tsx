"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, LogOut } from "lucide-react";
import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/client";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import type { Mess, Profile } from "@/lib/types";

type MyComplaint = {
  id: string;
  title: string;
  status: string;
  upvote_count: number;
  created_at: string;
};
type MyRating = { id: string; meal_id: string; stars: number; comment: string | null; rating_date: string };

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messes, setMesses] = useState<Mess[]>([]);
  const [rollNo, setRollNo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [myComplaints, setMyComplaints] = useState<MyComplaint[]>([]);
  const [myRatings, setMyRatings] = useState<MyRating[]>([]);
  const [myPraisesCount, setMyPraisesCount] = useState(0);

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
      setRollNo(prof?.roll_no ?? "");
      const { data: ms } = await supabase
        .from("messes")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setMesses(ms ?? []);
      const [c, r, p] = await Promise.all([
        supabase.rpc("my_complaints"),
        supabase.rpc("my_ratings"),
        supabase.rpc("my_praises"),
      ]);
      setMyComplaints(c.data ?? []);
      setMyRatings(r.data ?? []);
      setMyPraisesCount((p.data ?? []).length);
    })();
  }, []);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ roll_no: rollNo.trim() || null, mess_id: profile.mess_id })
      .eq("id", profile.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <NavBar userName={profile?.full_name} />

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-base font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">{profile?.full_name}</h1>
            <p className="text-xs text-zinc-400">{profile?.roll_no || "No roll number"}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="section-label">Mess</label>
            <select
              value={profile?.mess_id ?? ""}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, mess_id: e.target.value || null } : p))
              }
              className="input mt-1.5"
            >
              <option value="">Select your mess…</option>
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
          <div className="flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn-primary px-4 py-2 text-xs disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-4 flex items-center gap-1.5 text-xs font-medium text-red-500 transition hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>

      <h2 className="section-label mb-3 mt-8">My complaints ({myComplaints.length})</h2>
      <div className="space-y-2">
        {myComplaints.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/complaints/${c.id}`)}
            className="card card-hover block w-full p-3 text-left text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{c.title}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(c.status)}`}>
                {statusLabel(c.status)}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
              <ArrowUp className="h-3 w-3" /> {c.upvote_count} · {timeAgo(c.created_at)}
            </p>
          </button>
        ))}
        {myComplaints.length === 0 && (
          <p className="card border-dashed p-4 text-center text-sm text-zinc-400">
            No complaints filed.
          </p>
        )}
      </div>

      <h2 className="section-label mb-3 mt-8">
        My ratings ({myRatings.length}) · My praises ({myPraisesCount})
      </h2>
      <div className="space-y-2">
        {[...myRatings].reverse().map((r) => (
          <div key={r.id} className="card flex items-center justify-between p-3 text-sm">
            <div>
              <span className="text-amber-500">★</span> {r.stars}
              {r.comment && <span className="ml-2 text-xs text-zinc-500">{r.comment}</span>}
            </div>
            <span className="text-xs text-zinc-400">{r.rating_date}</span>
          </div>
        ))}
        {myRatings.length === 0 && (
          <p className="card border-dashed p-4 text-center text-sm text-zinc-400">
            Rate a meal to see it here.
          </p>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}
