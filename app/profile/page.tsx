import NavBar from "@/components/NavBar";
import ProfileEditor from "./profile-editor";
import { IconArrowUp, IconComplaint } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type MyComplaint = {
  id: string;
  title: string;
  upvote_count: number;
  created_at: string;
};

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="md:ml-60">
        <NavBar />
        <main className="mx-auto max-w-2xl px-4 pb-10 pt-4">
          <div className="card mt-6 p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
              <IconComplaint className="h-7 w-7 text-accent-ink" />
            </span>
            <h1 className="mt-4 text-xl font-bold tracking-tight">
              You&apos;re browsing anonymously
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Every college board is open for everyone to read. Sign in with
              Google only if you want to post complaints, vote and comment under
              your name.
            </p>
            <a
              href="/login"
              className="btn btn-primary mt-5 inline-flex px-6 py-2.5"
            >
              Sign in with Google
            </a>
          </div>
        </main>
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
  const totalUpvotes = myComplaints.reduce((n, cc) => n + (cc.upvote_count ?? 0), 0);

  // Resolve each complaint's college so links land on its (slug-scoped) board route.
  const admin = createAdminClient();
  const ids = myComplaints.map((cc) => cc.id);
  const hrefById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: rows } = await admin
      .from("complaints")
      .select("id, institution_id")
      .in("id", ids);
    const instIds = [...new Set((rows ?? []).map((r) => r.institution_id).filter(Boolean))] as string[];
    const slugById = new Map<string, string>();
    if (instIds.length > 0) {
      const { data: insts } = await admin
        .from("institutions")
        .select("id, slug")
        .in("id", instIds);
      for (const i of insts ?? []) slugById.set(i.id, i.slug);
    }
    for (const r of rows ?? []) {
      const slug = r.institution_id ? slugById.get(r.institution_id) : undefined;
      hrefById.set(r.id, slug ? `/${slug}/complaints/${r.id}` : `/complaints/${r.id}`);
    }
  }

  const firstNames = profile?.full_name?.split(" ") ?? [];
  const firstName = firstNames[0] ?? "there";
  const lastName = firstNames.slice(1).join(" ") || null;
  const displayName = profile?.full_name ?? "there";

  return (
    <div className="md:ml-60">
      <NavBar userName={profile?.full_name} />
      <main className="mx-auto max-w-2xl px-4 pb-10 pt-4">
        {/* Profile header */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-xl font-extrabold text-white shadow-[0_4px_14px_-6px_rgb(255_69_0/0.6)]">
              {initialsFor(displayName) || "?"}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight">
                {firstName} {lastName ?? ""}
              </h1>
              <p className="mt-0.5 text-sm text-muted">
                {profile?.roll_no || "No roll number yet"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <div className="rounded-xl bg-surface2/70 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Complaints filed
              </p>
              <p className="mt-0.5 text-lg font-bold">{myComplaints.length}</p>
            </div>
            <div className="rounded-xl bg-accent-soft px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-ink/70">
                Upvotes received
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-lg font-bold text-accent-ink">
                <IconArrowUp className="h-4 w-4" /> {totalUpvotes}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ProfileEditor fullName={profile?.full_name ?? ""} rollNo={profile?.roll_no ?? ""} />
        </div>

        <h2 className="section-label mt-8 mb-3">My complaints ({myComplaints.length})</h2>
        <div className="space-y-2">
          {myComplaints.map((cc) => (
            <a
              key={cc.id}
              href={hrefById.get(cc.id) ?? `/complaints/${cc.id}`}
              className="card card-hover flex items-stretch overflow-hidden"
            >
              <div className="hidden w-10 shrink-0 items-center justify-center border-r border-border/60 bg-surface2/50 sm:flex">
                <IconArrowUp className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1 py-3 pl-3.5 pr-3">
                <p className="truncate text-[14px] font-semibold text-foreground">{cc.title}</p>
                <p className="mt-1 flex items-center gap-1 text-[12.5px] text-muted">
                  <IconArrowUp className="h-3 w-3 text-zinc-400" /> {cc.upvote_count} · {timeAgo(cc.created_at)}
                </p>
              </div>
            </a>
          ))}
          {myComplaints.length === 0 && (
            <p className="card border-dashed p-6 text-center text-sm text-muted">
              No complaints filed yet. Head to your college&apos;s board and be the first.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}