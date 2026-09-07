import NavBar from "@/components/NavBar";
import ProfileEditor from "./profile-editor";
import { IconArrowUp, IconBookmark, IconComplaint } from "@/components/icons";
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

type SavedRow = {
  complaint_id: string;
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
      <div>
        <NavBar />
        <main className="mx-auto max-w-2xl px-4 pb-16 pt-2">
          <div className="card mt-8 p-8 text-center">
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
            <a href="/login" className="btn btn-primary mt-5 inline-flex px-6 py-2.5">
              Sign in with Google
            </a>
          </div>
        </main>
      </div>
    );
  }

  const [prof, c, savedResp] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, institution_id")
      .eq("id", user.id)
      .single(),
    supabase
      .rpc("my_complaints")
      .then((x) => ((x as unknown as { data: MyComplaint[] | null }).data ?? []) as MyComplaint[]),
    supabase.from("saved_complaints").select("complaint_id").eq("user_id", user.id),
  ]);

  const profile = (prof.data ?? null) as unknown as {
    id: string;
    full_name: string;
    institution_id: string | null;
  } | null;
  const myComplaints = c;
  const totalUpvotes = myComplaints.reduce((n, cc) => n + (cc.upvote_count ?? 0), 0);
  const karma = totalUpvotes;

  const admin = createAdminClient();

  // Resolve college names + slugs.
  const instIds = [
    ...(profile?.institution_id ? [profile.institution_id] : []),
  ] as string[];
  const slugById = new Map<string, string>();
  const nameById = new Map<string, string>();
  if (instIds.length > 0) {
    const { data: insts } = await admin
      .from("institutions")
      .select("id, slug, name")
      .in("id", instIds);
    for (const i of insts ?? []) {
      slugById.set(i.id, i.slug);
      nameById.set(i.id, i.name);
    }
  }

  // My complaints → board-scoped links.
  const myIds = myComplaints.map((cc) => cc.id);
  const hrefById = new Map<string, string>();
  if (myIds.length > 0) {
    const { data: rows } = await admin
      .from("complaints")
      .select("id, institution_id")
      .in("id", myIds);
    const allInst = [...new Set((rows ?? []).map((r) => r.institution_id).filter(Boolean))] as string[];
    if (allInst.length > 0) {
      const { data: insts } = await admin
        .from("institutions")
        .select("id, slug")
        .in("id", allInst);
      for (const i of insts ?? []) slugById.set(i.id, i.slug);
    }
    for (const r of rows ?? []) {
      const slug = r.institution_id ? slugById.get(r.institution_id) : undefined;
      hrefById.set(r.id, slug ? `/${slug}/complaints/${r.id}` : `/complaints/${r.id}`);
    }
  }

  // Saved complaints.
  const savedIds = ((savedResp.data ?? []) as SavedRow[]).map((r) => r.complaint_id);
  const saved = [] as { id: string; title: string; upvote_count: number; created_at: string; href: string }[];
  if (savedIds.length > 0) {
    const { data: rows } = await admin
      .from("complaints")
      .select("id, title, upvote_count, created_at, institution_id")
      .in("id", savedIds)
      .eq("is_flagged", false);
    const allInst = [...new Set((rows ?? []).map((r) => r.institution_id).filter(Boolean))] as string[];
    if (allInst.length > 0) {
      const { data: insts } = await admin
        .from("institutions")
        .select("id, slug")
        .in("id", allInst);
      for (const i of insts ?? []) slugById.set(i.id, i.slug);
    }
    for (const r of rows ?? []) {
      const slug = r.institution_id ? slugById.get(r.institution_id) : undefined;
      saved.push({
        id: r.id,
        title: r.title,
        upvote_count: r.upvote_count ?? 0,
        created_at: r.created_at,
        href: slug ? `/${slug}/complaints/${r.id}` : `/complaints/${r.id}`,
      });
    }
    saved.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const displayName = profile?.full_name ?? "there";
  const firstName = displayName.split(" ")[0] ?? "there";
  const collegeName = profile?.institution_id ? nameById.get(profile.institution_id) ?? null : null;

  return (
    <div>
      <NavBar userName={profile?.full_name} />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-2">
        {/* Profile header */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-strong text-xl font-extrabold text-white shadow-[0_6px_18px_-8px_rgb(79_70_229/0.7)]">
              {initialsFor(displayName) || "?"}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight">{firstName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {collegeName && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-[11.5px] font-semibold text-accent-ink">
                    🎓 {collegeName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-md bg-surface2 px-2 py-0.5 text-[11.5px] font-semibold text-muted">
                  <IconArrowUp className="h-3 w-3" /> {karma} karma
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
            <div className="rounded-xl bg-surface2/70 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Filed
              </p>
              <p className="mt-0.5 text-lg font-bold">{myComplaints.length}</p>
            </div>
            <div className="rounded-xl bg-accent-soft px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-ink/70">
                Karma
              </p>
              <p className="mt-0.5 text-lg font-bold text-accent-ink">{karma}</p>
            </div>
            <div className="rounded-xl bg-surface2/70 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Saved
              </p>
              <p className="mt-0.5 text-lg font-bold">{saved.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ProfileEditor fullName={displayName} collegeName={collegeName} />
        </div>

        <h2 className="section-label mt-8 mb-3 flex items-center gap-1.5">
          <IconBookmark className="h-3.5 w-3.5" /> Saved ({saved.length})
        </h2>
        <div className="space-y-2">
          {saved.map((cc) => (
            <a
              key={cc.id}
              href={cc.href}
              className="card card-hover flex items-stretch overflow-hidden"
            >
              <div className="hidden w-10 shrink-0 items-center justify-center border-r border-border/60 bg-surface2/50 sm:flex">
                <IconBookmark className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1 py-3 pl-3.5 pr-3">
                <p className="truncate text-[14px] font-semibold text-foreground">{cc.title}</p>
                <p className="mt-1 flex items-center gap-1 text-[12.5px] text-muted">
                  <IconArrowUp className="h-3 w-3 text-muted" /> {cc.upvote_count} · {timeAgo(cc.created_at)}
                </p>
              </div>
            </a>
          ))}
          {saved.length === 0 && (
            <p className="border border-dashed border-border rounded-xl p-6 text-center text-sm text-muted">
              Nothing saved yet. Hit “Save” on a complaint you want to revisit.
            </p>
          )}
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
                <IconArrowUp className="h-4 w-4 text-muted" />
              </div>
              <div className="min-w-0 flex-1 py-3 pl-3.5 pr-3">
                <p className="truncate text-[14px] font-semibold text-foreground">{cc.title}</p>
                <p className="mt-1 flex items-center gap-1 text-[12.5px] text-muted">
                  <IconArrowUp className="h-3 w-3 text-muted" /> {cc.upvote_count} · {timeAgo(cc.created_at)}
                </p>
              </div>
            </a>
          ))}
          {myComplaints.length === 0 && (
            <p className="border border-dashed border-border rounded-xl p-6 text-center text-sm text-muted">
              No complaints filed yet. Head to your college&apos;s board and be the first.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}