import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import NavBar from "@/components/NavBar";
import PraiseForm from "./praise-form";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import type { Praise } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PraisePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: praises } = await supabase
    .from("praises")
    .select("id, text, is_anonymous, created_at, praise_author")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-lg px-4">
      <NavBar />

      <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Praise
      </h1>
      <p className="mt-1 text-xs text-zinc-400">
        Thank the kitchen or mess staff — brighten someone&apos;s day.
      </p>

      <PraiseForm />

      <div className="mt-4 space-y-2">
        {((praises as unknown as Praise[] | null) ?? []).length === 0 && (
          <p className="card border-dashed p-8 text-center text-sm text-zinc-400">
            No praise yet — be the first!
          </p>
        )}
        {((praises as unknown as Praise[] | null) ?? []).map((p) => (
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
