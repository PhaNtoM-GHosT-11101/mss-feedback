"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { saveMenuItems, postAnnouncement, setMessMealActive } from "../actions";
import type { Meal, MenuItem, Mess } from "@/lib/types";

export function MenuEditor({
  meals,
  existing,
  messId,
  activeMealIds,
}: {
  meals: Meal[];
  existing: MenuItem[];
  messId: string | null;
  activeMealIds: Set<string>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const m of meals) {
      if (messId && !activeMealIds.has(m.id)) continue;
      const found = existing.find((i) => i.meal_id === m.id);
      init[m.id] = found?.item_text ?? "";
    }
    return init;
  });

  const visibleMeals = messId ? meals.filter((m) => activeMealIds.has(m.id)) : meals;

  async function save() {
    const payload = visibleMeals
      .filter((m) => items[m.id]?.trim())
      .map((m) => {
        const found = existing.find((i) => i.meal_id === m.id);
        return {
          id: found?.id,
          meal_id: m.id,
          item_text: items[m.id].trim(),
          menu_date: new Date().toISOString().slice(0, 10),
          weekday: null,
          is_template: false,
          mess_id: messId,
        };
      });
    await saveMenuItems(payload);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-3">
      {visibleMeals.map((m) => (
        <div key={m.id}>
          <label className="text-xs font-medium text-gray-500">{m.name}</label>
          <input
            value={items[m.id] ?? ""}
            onChange={(e) => setItems({ ...items, [m.id]: e.target.value })}
            placeholder="e.g. Poha, Chai, Bread-Jam"
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      ))}
      {visibleMeals.length === 0 && (
        <p className="text-xs text-gray-400">No meals are enabled for this mess yet — enable them below.</p>
      )}
      <button
        onClick={save}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        Save {messId ? "this mess's" : "shared"} menu
      </button>
    </div>
  );
}

export function MessSelector({
  messes,
  current,
  scoped,
}: {
  messes: Mess[];
  current: string;
  scoped: string[] | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(messId: string) {
    const next = new URLSearchParams(params.toString());
    if (messId) next.set("mess", messId);
    else next.delete("mess");
    router.push(`${pathname}?${next.toString()}`);
  }

  const list = scoped ? messes.filter((m) => scoped.includes(m.id)) : messes;

  return (
    <select
      value={current}
      onChange={(e) => go(e.target.value)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
    >
      <option value="">All messes (shared menu)</option>
      {list.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}

export function MessMealToggles({
  messId,
  meals,
  activeMealIds,
}: {
  messId: string;
  meals: Meal[];
  activeMealIds: Set<string>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle(mealId: string, next: boolean) {
    if (busy) return;
    setBusy(true);
    await setMessMealActive(messId, mealId, next);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      {meals.map((m) => {
        const on = activeMealIds.has(m.id);
        return (
          <div key={m.id} className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => toggle(m.id, e.target.checked)}
                disabled={busy}
                className="h-4 w-4 accent-emerald-600"
              />
              <span className={on ? "font-medium" : "text-gray-400 line-through"}>{m.name}</span>
            </label>
            <span className="text-[11px] text-gray-400">{on ? "served" : "not served"}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function submit() {
    if (!title.trim()) return;
    await postAnnouncement(title.trim(), body.trim());
    setTitle("");
    setBody("");
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Announcement title"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message (optional)"
        rows={2}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
      />
      <button
        onClick={submit}
        disabled={!title.trim()}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-40 dark:bg-white dark:text-gray-900"
      >
        Post announcement
      </button>
    </div>
  );
}