import NavBar from "@/components/NavBar";
import ProfileEditor from "./profile-editor";
import { IconArrowUp } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type MyComplaint = {
  id: string;
  title: string;
  upvote_count: number;
  created_at: string;
};

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

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 md:ml-60">
        <NavBar />
        <div className="card mt-8 p-8 text-center">
          <div className="text-[40px]">📣</div>
          <h1 className="mt-2 font-display text-xl font-bold tracking-tight">
            You&apos;re browsing anonymously
          </h1>
          <p className="mt-2 text-sm text-muted">
            Every college board is open for everyone to read. Sign in with
            Google only if you want to post complaints, vote and comment under
            your name.
          </p>
          <a
            href="/login"
            className="btn btn-primary mt-4 inline-flex items-center justify-center py-3"
          >
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  const [prof, c] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, roll_no")
      .eq("id", user.id)
      .single(),
    supabase
      .rpc("my_complaints")
      .then((x) => ((x as unknown as { data: MyComplaint[] | null }).data ?? []) as MyComplaint[]),
  ]);

  const profile = (prof.data ?? null) as unknown as { id: string; full_name: string; roll_no: string | null } | null;
  const myComplaints = c;
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
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Complaints filed
            </p>
            <p className="font-display text-xl font-bold">{myComplaints.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ProfileEditor fullName={profile?.full_name ?? ""} rollNo={profile?.roll_no ?? ""} />
      </div>

      <h2 className="section-label mb-3 mt-8">My complaints ({myComplaints.length})</h2>
      <div className="stagger space-y-2">
        {myComplaints.map((cc) => (
          <a
            key={cc.id}
            href={`/complaints/${cc.id}`}
            className="card card-hover block w-full p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{cc.title}</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <IconArrowUp className="h-3 w-3" /> {cc.upvote_count} · {timeAgo(cc.created_at)}
            </p>
          </a>
        ))}
        {myComplaints.length === 0 && (
          <p className="card border-dashed p-4 text-center text-sm text-muted">
            No complaints filed yet.
          </p>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}