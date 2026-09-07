"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, Eye, EyeOff, FileText } from "lucide-react";
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
  returnTo,
}: {
  categories: Category[];
  initialCategoryId: string | null;
  returnTo: string;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? "");
  const [mealSession, setMealSession] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [photos, setPhotos] = useState<File[]>([]);
  const [leftToday, setLeftToday] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
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
      setError("Pick a category, add a title (3+ chars) and description (10+ chars).");
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
    if (!user) {
      setError("Sign in to file a complaint.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("complaints").insert({
      user_id: user.id,
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
    router.push(returnTo);
    router.refresh();
  }

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-2">
        <button
          onClick={() => router.back()}
          className="tap mb-3 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[13px] font-medium text-zinc-500 transition hover:bg-surface2 hover:text-foreground dark:text-zinc-400"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
            <FileText className="h-5 w-5 text-accent-ink" />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight">File a complaint</h1>
            <p className="text-[13px] text-muted">
              Shows up on the board instantly — others can upvote and comment.
            </p>
          </div>
        </div>

        {signedIn === false && (
          <a
            href="/login"
            className="mt-4 block rounded-xl border border-dashed border-border p-3.5 text-center text-[13px] font-medium text-muted transition hover:border-accent hover:text-foreground"
          >
            You&apos;re browsing without an account. Sign in to post — anonymous is the default.
          </a>
        )}

        {leftToday !== null && (
          <p className="mt-2 text-[12.5px] text-muted">
            {leftToday > 0
              ? `${leftToday} complaint${leftToday > 1 ? "s" : ""} left today`
              : "Daily limit reached"}
          </p>
        )}

        <div className="card mt-4 space-y-5 p-4 md:p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="section-label">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input mt-1.5"
              >
                <option value="">Pick a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.is_mess ? "🍽 " : ""}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {showMealSession ? (
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
            ) : (
              <div />
            )}
          </div>

          <div>
            <label className="section-label">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. No water in my hostel block"
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
              className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted transition hover:border-accent hover:text-foreground"
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
              <p className="mt-1.5 truncate text-xs text-muted">
                {photos.map((p) => p.name).join(", ")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setAnonymous(!anonymous)}
            className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-sm transition ${
              anonymous
                ? "border-accent bg-accent text-white"
                : "border-border text-zinc-600 hover:border-zinc-400 dark:text-zinc-300"
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              {anonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Post anonymously
            </span>
            <span className={`text-[11px] ${anonymous ? "text-white/80" : "text-muted"}`}>
              everyone sees it as &ldquo;Anonymous&rdquo;
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
            className="btn-primary w-full py-3"
          >
            {saving ? "Submitting…" : "Post to the board"}
          </button>
        </div>
      </main>
    </div>
  );
}