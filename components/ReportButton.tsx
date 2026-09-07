"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconFlag } from "./icons";

export default function ReportButton({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [reported, setReported] = useState(false);
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
        const { data } = await sb.rpc("my_flagged_complaint_ids");
        if (on && Array.isArray(data) && data.some((r: { complaint_id: string }) => r.complaint_id === complaintId))
          setReported(true);
      } catch {
        /* precheck unavailable — leave as unreported */
      }
    })();
    return () => {
      on = false;
    };
  }, [complaintId]);

  const report = useCallback(async () => {
    if (busy || reported) return;
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
      const { error } = await sb
        .from("complaint_flags")
        .insert({ complaint_id: complaintId, user_id: user.id });
      if (!error || /duplicate|already exists|unique/i.test(error.message ?? "")) {
        setReported(true);
      }
    } finally {
      setBusy(false);
    }
  }, [complaintId, busy, reported, router]);

  return (
    <button
      type="button"
      onClick={report}
      disabled={reported}
      className={`tap inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12.5px] font-medium transition disabled:cursor-default ${
        reported
          ? "text-red-500 dark:text-red-400"
          : "text-muted hover:bg-surface2 hover:text-red-500"
      }`}
      aria-pressed={reported}
      aria-label={reported ? "Reported" : "Report this complaint"}
      title={reported ? "Reported — our team will review it" : "Report to moderation"}
    >
      <IconFlag
        className="h-[15px] w-[15px]"
        fill={reported ? "currentColor" : "none"}
        strokeWidth={reported ? 2 : 1.8}
      />
      {reported ? "Reported" : "Report"}
    </button>
  );
}