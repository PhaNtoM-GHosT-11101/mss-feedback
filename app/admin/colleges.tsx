"use client";

import { useState } from "react";
import Link from "next/link";
import { addInstitution } from "./actions";
import { type Institution } from "@/lib/institution";

export default function CollegesManager({
  institutions,
  selectedId,
}: {
  institutions: (Institution & { is_active: boolean })[];
  selectedId: string | null;
}) {
  const [slugValue, setSlugValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    await addInstitution(fd);
    setBusy(false);
    setSlugValue("");
  }

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold">Colleges</h2>
      <p className="mt-0.5 text-xs text-muted">
        Each college is its own public board. Pick one to edit its categories.
      </p>

      <ul className="mt-3 space-y-1.5">
        {institutions.map((i) => (
          <li key={i.id}>
            <Link
              href={`/admin?college=${i.id}`}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                i.id === selectedId
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-border bg-surface2 hover:border-accent/60"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <span className={`h-2 w-2 rounded-full ${i.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                {i.name}
              </span>
              <span className="text-[11px] text-muted">/{i.slug}</span>
            </Link>
          </li>
        ))}
        {institutions.length === 0 && (
          <li className="card border-dashed p-4 text-center text-sm text-muted">No colleges yet.</li>
        )}
      </ul>

      <form onSubmit={onCreate} className="mt-4 space-y-2 border-t border-border pt-4">
        <p className="text-xs font-semibold text-muted">Add a college</p>
        <input name="name" required placeholder="Name, e.g. NIT Agartala" className="input w-full" />
        <div className="flex items-center gap-2">
          <span className="text-muted">/</span>
          <input
            name="slug"
            required
            value={slugValue}
            onChange={(e) =>
              setSlugValue(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              )
            }
            placeholder="nit-agartala"
            className="input w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <input name="kind" placeholder="Kind (e.g. College)" className="input w-full" />
          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary whitespace-nowrap px-3 py-2 text-xs disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}