"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconBookmark } from "./icons";

export default function SaveButton({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const sb = createClient();
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!user) return;
        const { data } = await sb
          .from("saved_complaints")
          .select("complaint_id")
          .eq("complaint_id", complaintId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (on && data) setSaved(true);
      } catch {
        /* user not authed yet */
      }
    })();
    return () => {
      on = false;
    };
  }, [complaintId]);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      if (saved) {
        const { error } = await sb
          .from("saved_complaints")
          .delete()
          .eq("complaint_id", complaintId)
          .eq("user_id", user.id);
        if (!error) setSaved(false);
      } else {
        const { error } = await sb
          .from("saved_complaints")
          .insert({ complaint_id: complaintId, user_id: user.id });
        if (!error) setSaved(true);
      }
    } finally {
      setBusy(false);
    }
  }, [complaintId, saved, busy, router]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`tap inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12.5px] font-medium transition ${
        saved
          ? "text-accent-ink"
          : "text-muted hover:bg-surface2 hover:text-foreground"
      }`}
      aria-pressed={saved}
      aria-label={saved ? "Unsave" : "Save"}
    >
      <IconBookmark
        className="h-[15px] w-[15px]"
        fill={saved ? "currentColor" : "none"}
        strokeWidth={saved ? 2 : 1.8}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}