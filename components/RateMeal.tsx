"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star, Check } from "lucide-react";
import Stars from "./Stars";
import { createClient } from "@/lib/supabase/client";
import type { Meal } from "@/lib/types";
import { isMealOpen, windowLabel, mealEmoji } from "@/lib/meal";

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
      setError(
        error.message.includes("duplicate")
          ? "You already rated this meal today."
          : "Rating not submitted. The meal window may be closed.",
      );
      return;
    }
    router.refresh();
  }

  return (
    <div className="card card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-2xl ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
            {mealEmoji(meal)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight">
                {meal.name}
              </h3>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {windowLabel(meal)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
              {avg !== null ? (
                <>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {avg.toFixed(1)}
                  </span>
                  <span>· {count} rated</span>
                </>
              ) : (
                <span className="text-zinc-400">no ratings yet</span>
              )}
            </div>
          </div>
        </div>

        {ratedToday !== null ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-900">
            <Check className="h-3 w-3" /> Rated {ratedToday}★
          </span>
        ) : !open ? (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-400 dark:bg-zinc-800">
            Window closed
          </span>
        ) : null}
      </div>

      {open && ratedToday === null && messId === null && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900">
          Pick your mess in Profile to rate meals.
        </p>
      )}

      {open && ratedToday === null && messId !== null && (
        <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <Stars value={rating ?? 0} onChange={setRating} />
            <button
              onClick={submit}
              disabled={!rating || saving}
              className="btn-accent px-4 py-1.5 text-xs disabled:opacity-40"
            >
              {saving ? "Saving…" : "Submit"}
            </button>
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={200}
            placeholder="Optional note (e.g. dal was salty)"
            className="input mt-2 text-xs"
          />
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
