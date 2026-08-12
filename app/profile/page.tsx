import { redirect } from "next/navigation";
import { ArrowUp } from "lucide-react";
import NavBar from "@/components/NavBar";
import ProfileEditor from "./profile-editor";
import { createClient } from "@/lib/supabase/server";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import type { Mess, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type MyComplaint = {
  id: string;
  title: string;
  status: string;
  upvote_count: number;
  created_at: string;
};
type MyRating = { id: string; meal_id: string; stars: number; comment: string | null; rating_date: string };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [prof, ms, c, r, p] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, roll_no, mess_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("messes")
      .select("*")
      .eq("is_active", true)
      .order("name"),
    supabase
      .rpc("my_complaints")
      .then((x) => ((x as unknown as { data: MyComplaint[] | null }).data ?? []) as MyComplaint[]),
    supabase
      .rpc("my_ratings")
      .then((x) => ((x as unknown as { data: MyRating[] | null }).data ?? []) as MyRating[]),
    supabase
      .rpc("my_praises")
      .then((x) => ((x as unknown as { data: { id: string }[] | null }).data ?? []) as { id: string }[]),
  ]);

  const profile = (prof.data ?? null) as unknown as Profile | null;
  const messes = (ms.data ?? []) as Mess[];
  const myComplaints = c;
  const myRatings = [...r].reverse();
  const myPraisesCount = p.length;

  return (
    <div className="mx-auto max-w-2xl px-4">
      <NavBar userName={profile?.full_name} />

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-base font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">{profile?.full_name}</h1>
            <p className="text-xs text-zinc-400">{profile?.roll_no || "No roll number"}</p>
          </div>
        </div>

        <div className="mt-4">
          <ProfileEditor
            fullName={profile?.full_name ?? ""}
            rollNo={profile?.roll_no ?? ""}
            messId={profile?.mess_id ?? messes[0]?.id ?? ""}
            messes={messes}
          />
        </div>
      </div>

      <h2 className="section-label mb-3 mt-8">My complaints ({myComplaints.length})</h2>
      <div className="space-y-2">
        {myComplaints.map((c) => (
          <a
            key={c.id}
            href={`/complaints/${c.id}`}
            className="card card-hover block w-full p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{c.title}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(c.status)}`}>
                {statusLabel(c.status)}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
              <ArrowUp className="h-3 w-3" /> {c.upvote_count} · {timeAgo(c.created_at)}
            </p>
          </a>
        ))}
        {myComplaints.length === 0 && (
          <p className="card border-dashed p-4 text-center text-sm text-zinc-400">
            No complaints filed.
          </p>
        )}
      </div>

      <h2 className="section-label mb-3 mt-8">
        My ratings ({myRatings.length}) · My praises ({myPraisesCount})
      </h2>
      <div className="space-y-2">
        {myRatings.map((r) => (
          <div key={r.id} className="card flex items-center justify-between p-3 text-sm">
            <div>
              <span className="text-amber-500">★</span> {r.stars}
              {r.comment && <span className="ml-2 text-xs text-zinc-500">{r.comment}</span>}
            </div>
            <span className="text-xs text-zinc-400">{r.rating_date}</span>
          </div>
        ))}
        {myRatings.length === 0 && (
          <p className="card border-dashed p-4 text-center text-sm text-zinc-400">
            Rate a meal to see it here.
          </p>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}
