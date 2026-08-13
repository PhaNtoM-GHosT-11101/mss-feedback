import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import ProfileEditor from "./profile-editor";
import { IconArrowUp, IconMapPin } from "@/components/icons";
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

const AVATAR_EMOJIS = ["🧑‍🍳", "🦁", "🐼", "🦊", "🐯", "🦉", "🐸", "🐙", "🦄", "🥑", "🍉", "🌶️", "🥞", "🍩", "☕", "🎧", "⚽", "🎨", "🚀", "🧊"];

function avatarFor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_EMOJIS[h % AVATAR_EMOJIS.length];
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [prof, ms, c, r, p] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, roll_no, mess_id, mess:messes(name)")
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

  const profile = (prof.data ?? null) as unknown as (Profile & { mess: { name: string } | null }) | null;
  const messes = (ms.data ?? []) as Mess[];
  const myComplaints = c;
  const myRatings = [...r].reverse();
  const myPraisesCount = p.length;

  const myAvg = myRatings.length
    ? (myRatings.reduce((s, x) => s + x.stars, 0) / myRatings.length).toFixed(1)
    : null;
  const resolvedCount = myComplaints.filter((c) => c.status === "resolved").length;
  const firstNames = profile?.full_name?.split(" ") ?? [];
  const firstName = firstNames[0] ?? "there";
  const lastName = firstNames.slice(1).join(" ") || null;

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar userName={profile?.full_name} />

      {/* Hero */}
      <div className="card relative mt-3 overflow-hidden p-5">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(400px 180px at 85% -20%, rgb(232 160 32 / 0.14), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[--accent-soft] to-[--surface-2] text-3xl shadow-inner">
            {avatarFor(profile?.full_name ?? "?")}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold tracking-tight">
              {firstName} {lastName ?? ""}
            </h1>
            <p className="mt-0.5 text-xs text-muted">
              {profile?.roll_no || "No roll number yet"}
            </p>
            {profile?.mess?.name && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[--sage-soft] px-2.5 py-0.5 text-[11px] font-semibold text-[--sage]">
                <IconMapPin className="h-3 w-3" /> {profile.mess.name} Mess
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-4 gap-2 border-t border-border pt-4">
          <div className="text-center">
            <p className="font-display text-xl font-bold">{myRatings.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Ratings</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-bold">{myAvg ?? "—"}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Avg</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-bold">{myComplaints.length}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Issues</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-bold">{myPraisesCount}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Praises</p>
          </div>
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

      <h2 className="section-label mb-3 mt-8">
        My issues ({myComplaints.length})
        {resolvedCount > 0 && (
          <span className="ml-1.5 normal-case font-semibold text-[--sage]">
            · {resolvedCount} resolved
          </span>
        )}
      </h2>
      <div className="stagger space-y-2">
        {myComplaints.map((c) => (
          <a
            key={c.id}
            href={`/complaints/${c.id}`}
            className="card card-hover block w-full p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{c.title}</span>
              <span className={statusColor(c.status)}>{statusLabel(c.status)}</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <IconArrowUp className="h-3 w-3" /> {c.upvote_count} · {timeAgo(c.created_at)}
            </p>
          </a>
        ))}
        {myComplaints.length === 0 && (
          <p className="card border-dashed p-4 text-center text-sm text-muted">
            No complaints filed.
          </p>
        )}
      </div>

      <h2 className="section-label mb-3 mt-8">My ratings ({myRatings.length})</h2>
      <div className="stagger space-y-2">
        {myRatings.map((r) => (
          <div key={r.id} className="card flex items-center justify-between p-3 text-sm">
            <div>
              <span className="text-[--accent]">
                {"★".repeat(r.stars)}
                <span className="text-muted/40">{"★".repeat(5 - r.stars)}</span>
              </span>
              {r.comment && (
                <span className="ml-2 text-xs text-muted">{r.comment}</span>
              )}
            </div>
            <span className="text-xs text-muted">{r.rating_date}</span>
          </div>
        ))}
        {myRatings.length === 0 && (
          <p className="card border-dashed p-4 text-center text-sm text-muted">
            Rate a meal to see it here.
          </p>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}