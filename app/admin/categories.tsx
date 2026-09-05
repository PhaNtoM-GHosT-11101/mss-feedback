"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addCategory, deleteCategory, updateCategory } from "./actions";
import { IconCheck, IconX } from "@/components/icons";
import type { Category } from "@/lib/types";

export default function CategoriesPanel({
  institutionId,
  institutionName,
  institutionSlug,
  categories,
}: {
  institutionId: string;
  institutionName: string;
  institutionSlug: string;
  categories: Category[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isMess, setIsMess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    await addCategory(institutionId, name, isMess);
    setBusy(false);
    setName("");
    setIsMess(false);
  }

  async function toggleActive(c: Category) {
    await updateCategory(institutionId, c.id, { is_active: !c.is_active });
    router.refresh();
  }

  async function toggleMess(c: Category) {
    await updateCategory(institutionId, c.id, { is_mess: !c.is_mess });
    router.refresh();
  }

  async function onDelete(c: Category) {
    if (!confirm(`Delete "${c.name}"? Existing complaints in it keep their category.`)) return;
    await deleteCategory(institutionId, c.id);
    router.refresh();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Categories — {institutionName}</h2>
        <Link
          href={`/${institutionSlug}`}
          className="text-xs font-medium text-accent-strong"
        >
          view board →
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        Mess categories show a meal-session picker on the form.
      </p>

      <ul className="mt-3 space-y-1.5">
        {categories.map((c) => (
          <li
            key={c.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
              c.is_active ? "border-border bg-surface2" : "border-dashed border-border opacity-60"
            }`}
          >
            <span className="flex items-center gap-2 font-medium">
              {c.is_mess ? "🍽 " : ""}
              {c.name}
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${c.is_mess ? "bg-accent-soft text-accent-strong" : "bg-[--surface-2] text-muted"}`}>
                {c.is_mess ? "mess" : "general"}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <button
                onClick={() => toggleMess(c)}
                className="tap rounded px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-surface2"
                title="Toggle whether this is a mess category"
              >
                M
              </button>
              <button
                onClick={() => toggleActive(c)}
                className={`tap flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                  c.is_active ? "text-emerald-600" : "text-muted"
                }`}
                title={c.is_active ? "Active — click to hide" : "Hidden — click to show"}
              >
                <IconCheck className="h-3 w-3" /> Active
              </button>
              <button
                onClick={() => onDelete(c)}
                className="tap flex items-center gap-0.5 rounded px-2 py-1 text-[11px] font-medium text-red-400 transition hover:bg-red-500/10"
                title="Delete category"
              >
                <IconX className="h-3 w-3" />
              </button>
            </span>
          </li>
        ))}
        {categories.length === 0 && (
          <li className="card border-dashed p-4 text-center text-sm text-muted">
            No categories yet — add one below.
          </li>
        )}
      </ul>

      <form onSubmit={onCreate} className="mt-4 space-y-2 border-t border-border pt-4">
        <p className="text-xs font-semibold text-muted">Add a category</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hostel facilities"
          className="input w-full"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted">
            <input type="checkbox" checked={isMess} onChange={(e) => setIsMess(e.target.checked)} />
            Mess category (meal-session picker)
          </label>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="btn btn-primary px-3 py-2 text-xs disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add category"}
          </button>
        </div>
      </form>
    </div>
  );
}