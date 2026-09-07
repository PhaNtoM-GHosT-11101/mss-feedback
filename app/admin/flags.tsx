"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { setComplaintHidden, clearFlags } from "./actions";
import { IconFlag } from "@/components/icons";

export type FlagGroup = {
  complaintId: string;
  title: string;
  institution: { name: string; slug: string } | null;
  isFlagged: boolean;
  count: number;
  latest: string | null;
};

export default function FlagsPanel({ groups }: { groups: FlagGroup[] }) {
  const router = useRouter();

  if (groups.length === 0) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2">
          <IconFlag className="h-4 w-4 text-muted" strokeWidth={1.9} />
          <h2 className="text-sm font-semibold">Reports</h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          No reports yet. Anyone can flag a complaint and it lands here.
        </p>
      </div>
    );
  }

  async function act(fn: () => Promise<void>) {
    await fn();
    router.refresh();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconFlag className="h-4 w-4 text-red-500" strokeWidth={1.9} />
          <h2 className="text-sm font-semibold">Reports</h2>
        </div>
        <span className="text-[11px] font-semibold text-muted">
          {groups.length} flagged complaint{groups.length > 1 ? "s" : ""}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {groups.map((g) => (
          <li
            key={g.complaintId}
            className="rounded-xl border border-border bg-surface2 px-3 py-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{g.title}</p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {g.institution?.name ?? "Unknown board"} ·{" "}
                  {g.count} report{g.count > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() =>
                    act(() => setComplaintHidden(g.complaintId, !g.isFlagged))
                  }
                  className={`tap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    g.isFlagged
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
                  }`}
                >
                  {g.isFlagged ? "Restore" : "Hide"}
                </button>
                <button
                  onClick={() => act(() => clearFlags(g.complaintId))}
                  className="tap rounded-lg bg-surface px-2 py-1 text-[11px] font-medium text-muted transition hover:text-foreground"
                >
                  Clear
                </button>
                {g.institution && (
                  <Link
                    href={`/${g.institution.slug}/complaints/${g.complaintId}`}
                    className="tap rounded-lg bg-surface px-2 py-1 text-[11px] font-medium text-accent-strong transition hover:bg-accent-soft"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}