"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconCheck, IconStar } from "./icons";
import { createClient } from "@/lib/supabase/client";
import type { Meal } from "@/lib/types";
import { isMealOpen, windowLabel, mealEmoji, mealColor, RATING_FACES, RATING_FACE_LABELS } from "@/lib/meal";

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
  const [optimistic, setOptimistic] = useState<number | null>(null);
  const open = isMealOpen(meal);
  const effectiveRated = optimistic ?? ratedToday;
  const c = mealColor(meal);

  async function submit() {
    if (!rating || !messId) return;
    setSaving(true);
    setError(null);
    setOptimistic(rating);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setOptimistic(null);
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("ratings").insert({
      meal_id: meal.id,
      mess_id: messId,
      user_id: user.id,
      stars: rating,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) {
      setOptimistic(null);
      setError(
        error.message.includes("duplicate")
          ? "You already rated this meal today."
          : "Rating not submitted. The meal window may be closed.",
      );
      return;
    }
    setRating(null);
    setComment("");
    router.refresh();
  }

  return (
    <div className="card card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl ${c.iconBg}`}>
            {mealEmoji(meal)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight">{meal.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.chip}`}>
                {windowLabel(meal)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              {avg !== null ? (
                <>
                  <IconStar className="h-3.5 w-3.5 text-[--accent]" />
                  <span className="font-semibold text-foreground">{avg.toFixed(1)}</span>
                  <span>· {count} rated</span>
                </>
              ) : (
                <span className="text-muted/70">no ratings yet</span>
              )}
            </div>
          </div>
        </div>

        {effectiveRated !== null ? (
          <span className="anim-pop-in flex items-center gap-1 rounded-full bg-[--sage-soft] px-2.5 py-1 text-[11px] font-semibold text-[--sage]">
            <IconCheck className="h-3 w-3" /> {RATING_FACES[effectiveRated - 1]} {effectiveRated}★
          </span>
        ) : !open ? (
          <span className="rounded-full bg-[--surface-2] px-2.5 py-1 text-[11px] font-medium text-muted">
            Window closed
          </span>
        ) : null}
      </div>

      {open && effectiveRated === null && messId === null && (
        <p className="mt-3 rounded-lg bg-[--accent-soft] px-3 py-2 text-xs text-[--accent-strong]">
          Pick your mess in Profile to rate meals.
        </p>
      )}

      {open && effectiveRated === null && messId !== null && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="section-label mb-2.5">How was {meal.name.toLowerCase()}?</p>
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-end gap-1 sm:gap-2">
              {RATING_FACES.map((face, i) => {
                const value = i + 1;
                const selected = rating === value;
                return (
                  <button
                    key={face}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${RATING_FACE_LABELS[i]} (${value} stars)`}
                    className={`tap relative flex flex-col items-center rounded-xl px-1.5 pt-1.5 pb-1 transition sm:px-2 ${
                      selected ? "bg-[--accent-soft] ring-2 ring-[--accent]" : "hover:bg-[--surface-2]"
                    }`}
                  >
                    <span
                      className={`text-2xl leading-none transition-transform sm:text-3xl ${
                        selected ? "scale-125" : "opacity-70 hover:scale-110 hover:opacity-100"
                      }`}
                      style={{ transformOrigin: "bottom center" }}
                    >
                      {face}
                    </span>
                    <span
                      className={`mt-1 hidden text-[9px] font-semibold sm:block ${
                        selected ? "text-[--accent-strong]" : "text-muted"
                      }`}
                    >
                      {RATING_FACE_LABELS[i]}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={submit}
              disabled={!rating || saving}
              className="btn btn-primary tap px-4 py-2 text-xs disabled:opacity-40"
            >
              {saving ? "Saving…" : "Submit"}
            </button>
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={200}
            placeholder="Optional note (e.g. dal was salty)"
            className="input mt-2.5 text-xs"
          />
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
