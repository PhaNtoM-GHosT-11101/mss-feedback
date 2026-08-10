"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

export default function NewComplaintPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [leftToday, setLeftToday] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("complaint_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data ?? []);
        if (data?.length) setCategoryId(data[0].id);
      });
    supabase.rpc("complaints_left_today").then(({ data }) => setLeftToday(data));
  }, []);

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
      if (file.size > 4 * 1024 * 1024) {
        setError("Photos must be under 4MB each.");
        setSaving(false);
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("complaint-photos")
        .upload(path, file);
      if (upErr) {
        setError(`Photo upload failed: ${upErr.message}`);
        setSaving(false);
        return;
      }
      urls.push(
        supabase.storage.from("complaint-photos").getPublicUrl(path).data.publicUrl,
      );
    }

    const { error } = await supabase.from("complaints").insert({
      category_id: categoryId,
      title: title.trim(),
      description: description.trim(),
      is_anonymous: anonymous,
      photo_urls: urls,
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
    router.push("/complaints");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4">
      <NavBar />
      <h1 className="text-lg font-semibold">File a complaint</h1>
      {leftToday !== null && (
        <p className="mt-1 text-xs text-gray-500">
          {leftToday > 0
            ? `${leftToday} complaint${leftToday > 1 ? "s" : ""} left today`
            : "Daily limit reached"}
        </p>
      )}

      <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label className="text-xs font-medium text-gray-500">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Roti was served cold"
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Describe the issue — what happened, when, which meal…"
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">
            Photos (optional, max 2)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              setPhotos(Array.from(e.target.files ?? []).slice(0, 2))
            }
            className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-600 dark:file:bg-gray-800 dark:file:text-gray-300"
          />
          {photos.length > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              {photos.map((p) => p.name).join(", ")}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Post anonymously (committee still sees your name)
        </label>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={saving || (leftToday !== null && leftToday <= 0)}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
        >
          {saving ? "Submitting…" : "Submit complaint"}
        </button>
      </div>
      <div className="h-4" />
    </div>
  );
}
