import { unstable_cache } from "next/cache";
import NavBar from "@/components/NavBar";
import PraiseForm from "./praise-form";
import { IconPraise } from "@/components/icons";
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
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar />

      <h1 className="flex items-center gap-2 pt-2 font-display text-2xl font-bold tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[--sage-soft] text-[--sage]">
          <IconPraise className="h-5 w-5" />
        </span>
        Praise
      </h1>
      <p className="mt-1 text-xs text-muted">
        Thank the kitchen or mess staff — brighten someone&apos;s day.
      </p>

      <PraiseForm />

      <div className="stagger mt-5 space-y-3">
        {praises.length === 0 && (
          <div className="card flex flex-col items-center border-dashed p-10 text-center">
            <span className="anim-float text-5xl">🤗</span>
            <p className="mt-3 text-sm font-medium">No praise yet</p>
            <p className="mt-1 text-xs text-muted">
              Be the first to hand out a ticket — the kitchen earns them.
            </p>
          </div>
        )}
        {praises.map((p, i) => (
          <div key={p.id} className="ticket">
            <div className="ticket-strip">
              <IconPraise className="h-4 w-4 text-[--accent]" />
              <span className="section-label !text-[10px]">Praise ticket</span>
              <span className="ml-auto text-[10px] font-bold text-muted">
                #{String(praises.length - i).padStart(3, "0")}
              </span>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-sm leading-relaxed">{p.text}</p>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-border px-4 py-2">
              <span className="text-[10px] font-medium text-muted">
                {p.is_anonymous ? "Anonymous" : p.praise_author} · {timeAgo(p.created_at)}
              </span>
              <span className="ticket-barcode" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-4" />
    </div>
  );
}
