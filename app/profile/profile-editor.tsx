"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Mess } from "@/lib/types";

export default function ProfileEditor({
  fullName,
  rollNo,
  messId,
  messes,
}: {
  fullName: string;
  rollNo: string;
  messId: string;
  messes: Mess[];
}) {
  const router = useRouter();
  const [roll, setRoll] = useState(rollNo);
  const [mess, setMess] = useState(messId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (busy) return;
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
    const { error: err } = await supabase
      .from("profiles")
      .update({ roll_no: roll.trim().slice(0, 20), mess_id: mess })
      .eq("id", user.id);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="card space-y-3 p-4">
      <div>
        <label className="section-label mb-1 block">Name</label>
        <p className="text-sm font-medium">{fullName}</p>
      </div>
      <div>
        <label className="section-label mb-1 block" htmlFor="roll">Roll number</label>
        <input
          id="roll"
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
          placeholder="e.g. 23CS001"
          className="input w-full"
        />
      </div>
      <div>
        <label className="section-label mb-1 block" htmlFor="mess">Mess</label>
        <select id="mess" value={mess} onChange={(e) => setMess(e.target.value)} className="input w-full">
          {messes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={save} disabled={busy} className="btn-primary flex flex-1 items-center justify-center gap-1.5 py-2 text-xs">
          <Save className="h-3.5 w-3.5" /> {busy ? "Saving…" : "Save"}
        </button>
        <button onClick={signOut} className="btn-ghost flex items-center gap-1.5 py-2 text-xs">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}
