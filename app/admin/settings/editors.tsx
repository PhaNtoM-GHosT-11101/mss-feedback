"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveCategories,
  deleteCategory,
  saveMeals,
  deleteMeal,
  saveMesses,
  deleteMess,
  saveGeneralSettings,
  addCommitteeMember,
  removeCommitteeMember,
} from "../actions";
import type { Category, Meal, Mess } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export function CategoriesEditor({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);

  function set(id: string, patch: Partial<Category>) {
    setList(list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function save() {
    await saveCategories(list);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      {list.map((c) => (
        <div key={c.id} className="flex items-center gap-2 text-sm">
          <input
            value={c.name}
            onChange={(e) => set(c.id, { name: e.target.value })}
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
          />
          <label className="flex items-center gap-1 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={c.is_active}
              onChange={(e) => set(c.id, { is_active: e.target.checked })}
            />
            active
          </label>
          <button
            onClick={async () => { await deleteCategory(c.id); router.refresh(); }}
            className="text-xs text-red-400 hover:text-red-600"
          >
            del
          </button>
        </div>
      ))}
      <button
        onClick={() => setList([...list, { id: crypto.randomUUID(), name: "", sort_order: list.length, is_active: true }])}
        className="text-xs font-medium text-emerald-600 hover:underline"
      >
        + add category
      </button>
      <div>
        <button
          onClick={save}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          Save categories
        </button>
      </div>
    </div>
  );
}

export function MealsEditor({ initial }: { initial: Meal[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);

  function set(id: string, patch: Partial<Meal>) {
    setList(list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function save() {
    await saveMeals(list);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      {list.map((m) => (
        <div key={m.id} className="grid grid-cols-[1fr_90px_90px_70px_24px] items-center gap-2 text-sm">
          <input
            value={m.name}
            onChange={(e) => set(m.id, { name: e.target.value })}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            value={m.start_hour}
            onChange={(e) => set(m.id, { start_hour: Number(e.target.value) })}
            type="number"
            min={0}
            max={23}
            title="Start hour"
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            value={m.end_hour}
            onChange={(e) => set(m.id, { end_hour: Number(e.target.value) })}
            type="number"
            min={0}
            max={23}
            title="End hour"
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none dark:border-gray-700 dark:bg-gray-800"
          />
          <label className="flex items-center gap-1 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={m.is_active}
              onChange={(e) => set(m.id, { is_active: e.target.checked })}
            />
            on
          </label>
          <button
            onClick={async () => { await deleteMeal(m.id); router.refresh(); }}
            className="text-xs text-red-400 hover:text-red-600"
          >
            del
          </button>
        </div>
      ))}
      <div className="text-xs text-gray-400">hours are 0–23 (Asia/Kolkata)</div>
      <button
        onClick={() =>
          setList([...list, { id: crypto.randomUUID(), name: "", start_hour: 7, end_hour: 10, sort_order: list.length, is_active: true }])
        }
        className="text-xs font-medium text-emerald-600 hover:underline"
      >
        + add meal slot
      </button>
      <div>
        <button
          onClick={save}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          Save meal slots
        </button>
      </div>
    </div>
  );
}

export function MessesEditor({ initial }: { initial: Mess[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);

  function set(id: string, patch: Partial<Mess>) {
    setList(list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function save() {
    await saveMesses(list);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      {list.map((m) => (
        <div key={m.id} className="flex items-center gap-2 text-sm">
          <input
            value={m.name}
            onChange={(e) => set(m.id, { name: e.target.value })}
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
          />
          <label className="flex items-center gap-1 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={m.is_active}
              onChange={(e) => set(m.id, { is_active: e.target.checked })}
            />
            active
          </label>
          <button
            onClick={async () => { await deleteMess(m.id); router.refresh(); }}
            className="text-xs text-red-400 hover:text-red-600"
          >
            del
          </button>
        </div>
      ))}
      <button
        onClick={() => setList([...list, { id: crypto.randomUUID(), name: "", is_active: true }])}
        className="text-xs font-medium text-emerald-600 hover:underline"
      >
        + add mess
      </button>
      <div>
        <button
          onClick={save}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          Save messes
        </button>
      </div>
    </div>
  );
}

export function GeneralEditor({ initial }: { initial: { daily_complaint_limit?: number; digest_emails?: string[]; weekly_report_emails?: string[] } }) {
  const router = useRouter();
  const [limit, setLimit] = useState(String(initial.daily_complaint_limit ?? 3));
  const [digest, setDigest] = useState((initial.digest_emails ?? []).join(", "));
  const [weekly, setWeekly] = useState((initial.weekly_report_emails ?? []).join(", "));

  async function save() {
    await saveGeneralSettings({
      daily_complaint_limit: Math.max(1, Number(limit) || 3),
      digest_emails: digest.split(",").map((s) => s.trim()).filter(Boolean),
      weekly_report_emails: weekly.split(",").map((s) => s.trim()).filter(Boolean),
    });
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-3 text-sm">
      <div>
        <label className="text-xs font-medium text-gray-500">Daily complaint limit per student</label>
        <input
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          type="number"
          min={1}
          className="mt-1 w-full max-w-[200px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">Daily digest emails (comma-separated)</label>
        <input
          value={digest}
          onChange={(e) => setDigest(e.target.value)}
          placeholder="mss@nita.ac.in, warden@nita.ac.in"
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500">Weekly report emails (comma-separated)</label>
        <input
          value={weekly}
          onChange={(e) => setWeekly(e.target.value)}
          placeholder="same or different"
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>
      <button
        onClick={save}
        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
      >
        Save rules & emails
      </button>
    </div>
  );
}

export function MembersEditor({
  members,
  emailBy,
}: {
  members: { user_id: string; role: string; created_at: string }[];
  emailBy: Map<string, string>;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"committee" | "admin">("committee");

  async function add() {
    if (!email.trim()) return;
    await addCommitteeMember(email.trim().toLowerCase(), role);
    setEmail("");
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2 text-sm">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member@nita.ac.in"
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "committee" | "admin")}
          className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="committee">Committee</option>
          <option value="admin">Super-admin</option>
        </select>
        <button
          onClick={add}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 text-sm dark:bg-gray-800">
            <div className="min-w-0">
              <p className="truncate font-medium">{emailBy.get(m.user_id) ?? m.user_id}</p>
              <p className="text-[11px] text-gray-400">
                {m.role === "admin" ? "Super-admin" : "Committee"} · joined {timeAgo(m.created_at)}
              </p>
            </div>
            <button
              onClick={async () => { await removeCommitteeMember(m.user_id); router.refresh(); }}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
        {members.length === 0 && <p className="text-center text-xs text-gray-400">No committee members yet.</p>}
      </div>
    </div>
  );
}
