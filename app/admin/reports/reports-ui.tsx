"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconChevronDown, IconCalendar } from "@/components/icons";

export function ExportButtons({ ratingsCSV, complaintsCSV }: { ratingsCSV: string; complaintsCSV: string }) {
  function download(name: string, content: string) {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => download("ratings.csv", ratingsCSV)}
        className="btn btn-ghost tap px-3 py-1.5 text-xs"
      >
        Ratings CSV
      </button>
      <button
        onClick={() => download("complaints.csv", complaintsCSV)}
        className="btn btn-ghost tap px-3 py-1.5 text-xs"
      >
        Complaints CSV
      </button>
    </div>
  );
}

export function RangePicker({
  initial,
}: {
  initial: { from: string; to: string; range: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [custom, setCustom] = useState(false);

  function go(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    router.push(`/admin/reports?${next.toString()}`);
  }

  const preset = (days: number, label: string, key: string) => (
    <button
      key={key}
      onClick={() => {
        setCustom(false);
        go({ range: String(days), from: "", to: "" });
      }}
      className={`chip ${initial.range === String(days) && !custom ? "chip-active" : ""}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1.5">
      {preset(7, "7d", "7")}
      {preset(30, "30d", "30")}
      {preset(90, "90d", "90")}
      <button
        onClick={() => setCustom((v) => !v)}
        className={`chip ${custom ? "chip-active" : ""}`}
      >
        <IconCalendar className="h-3 w-3" /> Custom
        <IconChevronDown className="h-3 w-3" />
      </button>
      {custom && (
        <div className="anim-fade-in flex items-center gap-1.5">
          <input
            type="date"
            defaultValue={initial.from}
            onChange={(e) => go({ from: e.target.value, range: "" })}
            className="input !w-36 !rounded-lg !px-2 !py-1 text-xs"
          />
          <span className="text-xs text-muted">→</span>
          <input
            type="date"
            defaultValue={initial.to}
            onChange={(e) => go({ to: e.target.value, range: "" })}
            className="input !w-36 !rounded-lg !px-2 !py-1 text-xs"
          />
        </div>
      )}
    </div>
  );
}
