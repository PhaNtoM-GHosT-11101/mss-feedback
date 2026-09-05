"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, Eye, EyeOff, Utensils } from "lucide-react";
import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

const MEAL_SESSIONS = [
  { value: "", label: "Not meal-specific" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snacks", label: "Snacks" },
];

export default function ComplaintForm({
  categories,
  initialCategoryId,
  isMess,
}: {
  categories: Category[];
  initialCategoryId: string | null;
  isMess: boolean;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? "");
  const [mealSession, setMealSession] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [leftToday, setLeftToday] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messId, setMessId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("mess_id")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }) => setMessId(p?.mess_id ?? null));
      }
    });
    supabase.rpc("complaints_left_today").then(({ data }) => setLeftToday(data));
  }, []);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const showMealSession = !!selectedCategory?.is_mess;

  async function compressImage(file: File): Promise<Blob> {
    try {
      const bmp = await createImageBitmap(file);
      const max = 1600;
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (scale >= 1 && file.size <= 4 * 1024 * 1024) {
        bmp.close();
        return file;
      }
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bmp.close();
        return file;
      }
      ctx.drawImage(bmp, 0, 0, w, h);
      bmp.close();
      return await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.72),
      );
    } catch {
      return file;
    }
  }

  async function submit() {
    if (!categoryId || title.trim().length < 3 || description.trim().length < 10) {
      setError("Title (3+ chars) and description (10+ chars) required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const urls: string[] = [];
    for (const file of photos.slice(0, 2)) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Photos must be under 10MB each.");
        setSaving(false);
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const blob = await compressImage(file);
      const uploadFile = blob === file ? file : new File([blob], path, { type: "image/jpeg" });
      const { error: upErr } = await supabase.storage
        .from("complaint-photos")
        .upload(path, uploadFile);
      if (upErr) {
        setError(`Photo upload failed: ${upErr.message}`);
        setSaving(false);
        return;
      }
      urls.push(
        supabase.storage.from("complaint-photos").getPublicUrl(path).data.publicUrl,
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("complaints").insert({
      user_id: user.id,
      mess_id: messId,
      category_id: categoryId,
      title: title.trim(),
      description: description.trim(),
      is_anonymous: anonymous,
      photo_urls: urls,
      meal_session: showMealSession && mealSession ? mealSession : null,
    });

    setSaving(false);
    if (error) {
      setError(
        error.message.includes("complaints_left_today")
          ? "Daily complaint limit reached (3/day)."
          : error.message,
      );
      return;
    }
    router.push(isMess ? "/mess" : "/complaints");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <NavBar />
      <button
        onClick={() => router.back()}
        className="mb-3 flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      {isMess ? (
        <>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[--plum-soft] text-[--plum]">
              <Utensils className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight">Report a mess problem</h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Filed as a complaint — the mess committee will review and resolve it.
          </p>
        </>
      ) : (
        <h1 className="text-xl font-semibold tracking-tight">File a complaint</h1>
      )}

      {leftToday !== null && (
        <p className="mt-1 text-xs text-zinc-400">
          {leftToday > 0
            ? `${leftToday} complaint${leftToday > 1 ? "s" : ""} left today`
            : "Daily limit reached"}
        </p>
      )}

      <div className="card mt-4 space-y-4 p-4">
        <div>
          <label className="section-label">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input mt-1.5"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.is_mess ? "🍽 " : ""}
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {showMealSession && (
          <div>
            <label className="section-label">Which meal is this about?</label>
            <select
              value={mealSession}
              onChange={(e) => setMealSession(e.target.value)}
              className="input mt-1.5"
            >
              {MEAL_SESSIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="section-label">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={isMess ? "e.g. Rice was undercooked at dinner" : "e.g. No water in my hostel block"}
            className="input mt-1.5"
          />
        </div>

        <div>
          <label className="section-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Describe the issue — what happened, where, when…"
            className="input mt-1.5 resize-none"
          />
        </div>

        <div>
          <label className="section-label">Photos (optional, max 2 · ≤10 MB each)</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-sm text-zinc-500 transition hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <Camera className="h-4 w-4" />
            {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? "s" : ""} selected` : "Add photos"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 2))}
            className="hidden"
          />
          {photos.length > 0 && (
            <p className="mt-1.5 truncate text-xs text-zinc-400">
              {photos.map((p) => p.name).join(", ")}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAnonymous(!anonymous)}
          className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-sm transition ${
            anonymous
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
              : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
          }`}
        >
          <span className="flex items-center gap-2">
            {anonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            Post anonymously
          </span>
          <span className={`text-[11px] ${anonymous ? "text-white/70 dark:text-zinc-600" : "text-zinc-400"}`}>
            committee still sees your name
          </span>
        </button>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={saving || (leftToday !== null && leftToday <= 0)}
          className="btn-primary w-full py-3 disabled:opacity-40"
        >
          {saving
            ? "Submitting…"
            : isMess
              ? "Submit mess complaint"
              : "Submit complaint"}
        </button>
      </div>
      <div className="h-4" />
    </div>
  );
}