"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Stars from "./Stars";
import { createClient } from "@/lib/supabase/client";
import type { Meal } from "@/lib/types";
import { isMealOpen, windowLabel } from "@/lib/meal";

type Props = {
  meal: Meal;
  messId: string | null;
  ratedToday: number | null;
  avg: number | null;
  count: number;
};

export default function RateMeal({
  meal,
  messId,
  ratedToday,
  avg,
  count,
}: Props) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = isMealOpen(meal);
  const canRate = open && !saving && messId !== null;

  async function submit() {
    if (!rating || !messId) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("ratings").insert({
      meal_id: meal.id,
      mess_id: messId,
      stars: rating,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message.includes("duplicate")
        ? "You already rated this meal today."
        : "Rating not submitted. The meal window may be closed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{meal.name}</h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {windowLabel(meal)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
            <span className="text-amber-500">★</span>
            {avg !== null ? `${avg.toFixed(1)} avg` : "no ratings yet"}
            {count > 0 ? ` · ${count} rated` : ""}
          </div>
        </div>

        {ratedToday !== null ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Rated ★{ratedToday}
          </span>
        ) : !open ? (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-400 dark:bg-gray-800">
            Closed
          </span>
        ) : null}
      </div>

      {open && ratedToday === null && messId === null && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Pick your mess in Profile to rate meals.
        </p>
      )}

      {open && ratedToday === null && messId !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <Stars value={rating ?? 0} onChange={setRating} />
            <button
              onClick={submit}
              disabled={!rating || saving}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Submit"}
            </button>
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={200}
            placeholder="Optional note (e.g. dal was salty)"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
          />
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
