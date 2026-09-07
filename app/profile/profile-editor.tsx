"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileEditor({
  fullName,
  collegeName,
}: {
  fullName: string;
  collegeName: string | null;
}) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0">
          <label className="section-label mb-1 block">Name</label>
          <p className="text-sm font-medium">{fullName}</p>
        </div>
        <div className="min-w-0">
          <label className="section-label mb-1 block">College</label>
          <p className="text-sm font-medium">{collegeName ?? "Not set"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={signOut}
          className="btn-ghost flex items-center gap-1.5 py-2 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}