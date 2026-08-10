"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveMenuItems, deleteMenuItem, postAnnouncement } from "../actions";
import type { Meal, MenuItem } from "@/lib/types";

export function MenuEditor({
  meals,
  existing,
}: {
  meals: Meal[];
  existing: MenuItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const m of meals) {
      const found = existing.find((i) => i.meal_id === m.id);
      init[m.id] = found?.item_text ?? "";
    }
    return init;
  });

  async function save() {
    const payload = meals
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
        };
      });
    await saveMenuItems(payload);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-3">
      {meals.map((m) => (
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
      <button
        onClick={save}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        Save today&apos;s menu
      </button>
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
        maxLength={120}
        placeholder="Title (e.g. Mess closed Sunday)"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="Details (optional)"
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

export function DeleteMenuItemButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await deleteMenuItem(id);
        router.refresh();
      }}
      className="text-xs text-red-400 hover:text-red-600"
    >
      remove
    </button>
  );
}
