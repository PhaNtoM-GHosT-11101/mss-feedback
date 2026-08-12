import { unstable_cache } from "next/cache";
import { Sparkles } from "lucide-react";
import NavBar from "@/components/NavBar";
import PraiseForm from "./praise-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/format";
import type { Praise } from "@/lib/types";

export const revalidate = 30;

const getPraises = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("praises")
      .select("id, text, is_anonymous, created_at, praise_author")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as unknown as Praise[];
  },
  ["praises-list"],
  { revalidate: 30 },
);

export default async function PraisePage() {
  const praises = await getPraises();

  return (
    <div className="mx-auto max-w-2xl px-4">
      <NavBar />

      <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Praise
      </h1>
      <p className="mt-1 text-xs text-zinc-400">
        Thank the kitchen or mess staff — brighten someone&apos;s day.
      </p>

      <PraiseForm />

      <div className="mt-4 space-y-2">
        {praises.length === 0 && (
          <p className="card border-dashed p-8 text-center text-sm text-zinc-400">
            No praise yet — be the first!
          </p>
        )}
        {praises.map((p) => (
          <div key={p.id} className="card p-4">
            <p className="text-sm leading-relaxed">{p.text}</p>
            <p className="mt-2 text-xs text-zinc-400">
              {p.is_anonymous ? "Anonymous" : p.praise_author} · {timeAgo(p.created_at)}
            </p>
          </div>
        ))}
      </div>
      <div className="h-4" />
    </div>
  );
}