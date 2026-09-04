import { redirect } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import NavBar from "@/components/NavBar";
import InstitutionPicker from "@/components/InstitutionPicker";
import {
  IconPraise,
  IconComplaint,
  IconArrowUp,
  IconPlate,
} from "@/components/icons";
import { statusColor, statusLabel, timeAgo } from "@/lib/format";
import { getInstitution, listInstitutions } from "@/lib/institution";
import type { Praise } from "@/lib/types";

export const dynamic = "force-dynamic";

const getShared = unstable_cache(
  async (institutionId: string) => {
    const db = createAdminClient();
    const [announcements, top, praises] = await Promise.all([
      db
        .from("announcements")
        .select("*")
        .eq("institution_id", institutionId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3),
      db
        .from("complaints")
        .select(
          "id, title, status, upvote_count, created_at, is_pinned, complaint_author, complaint_author_roll, category:complaint_categories(name)",
        )
        .eq("institution_id", institutionId)
        .eq("is_flagged", false)
        .order("is_pinned", { ascending: false })
        .order("upvote_count", { ascending: false })
        .limit(5),
      db
        .from("praises")
        .select("id, text, is_anonymous, created_at, praise_author")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false })
        .limit(4),
    ]);
    return { announcements, top, praises };
  },
  ["home-hub"],
  { revalidate: 60 },
);

export default async function HomePage() {
  const institution = await getInstitution();

  // No institution context -> public landing / institution picker.
  if (!institution) {
    const institutions = await listInstitutions();
    return <InstitutionPicker institutions={institutions} />;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const {
    data: profile,
  } = await supabase
    .from("profiles")
    .select("id, full_name, roll_no, is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-500 dark:bg-red-950/50">
          !
        </div>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">Account suspended</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Your account has been suspended by the campus committee for violating the
          code of conduct. If you believe this is a mistake, contact the committee.
        </p>
      </div>
    );
  }

  const { announcements, top, praises } = await getShared(institution.id);

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 5
      ? "Burning the midnight oil"
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";
  const fullDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 md:ml-60">
      <NavBar userName={profile?.full_name} institutionName={institution.name} />

      {/* Greeting */}
      <div className="pt-3">
        <p className="section-label">{fullDate}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
          {greeting}, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Complaints, praise and daily mess ratings for {institution.name}.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2.5 mt-5">
        <Link
          href="/complaints/new"
          className="card card-hover tap flex flex-col items-center gap-2 p-3 text-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
            <IconComplaint className="h-5 w-5 text-accent-strong" />
          </span>
          <span className="text-sm font-semibold">File complaint</span>
        </Link>
        <Link
          href="/praise"
          className="card card-hover tap flex flex-col items-center gap-2 p-3 text-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--surface-2]">
            <IconPraise className="h-5 w-5 text-muted" />
          </span>
          <span className="text-sm font-semibold">Give praise</span>
        </Link>
        <Link
          href="/mess"
          className="card card-hover tap flex flex-col items-center gap-2 p-3 text-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--surface-2]">
            <IconPlate className="h-5 w-5 text-muted" />
          </span>
          <span className="text-sm font-semibold">Mess &amp; menu</span>
        </Link>
      </div>

      {announcements.data && announcements.data.length > 0 && (
        <div className="mt-5 space-y-2">
          {announcements.data.map((a) => (
            <div
              key={a.id}
              className="card flex items-start gap-3 border-[--accent]/30 bg-[--accent-soft]/60 p-3.5"
            >
              <span className="text-lg leading-none">📢</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                {a.body && <p className="mt-0.5 text-sm text-muted">{a.body}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-7 flex items-baseline justify-between">
        <h2 className="section-label">Top issues</h2>
        <Link
          href="/complaints"
          className="text-[11px] font-medium text-muted hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(() => {
          const list = (top.data ?? []) as {
            id: string;
            title: string;
            status: string;
            upvote_count: number;
            created_at: string;
            complaint_author: string | null;
            category: { name: string }[] | null;
          }[];
          if (list.length === 0) {
            return (
              <p className="card border-dashed p-5 text-center text-sm text-muted sm:col-span-2">
                No complaints yet — be the first voice.
              </p>
            );
          }
          return list.map((c) => (
            <Link
              key={c.id}
              href={`/complaints/${c.id}`}
              className="card card-hover group flex items-start gap-3 p-3.5"
            >
              <div className="flex flex-col items-center rounded-lg bg-[--surface-2] px-2 py-1">
                <span className="text-sm font-bold">{c.upvote_count}</span>
                <IconArrowUp className="h-3 w-3 text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span className={statusColor(c.status)}>{statusLabel(c.status)}</span>
                  {c.category && c.category.length > 0 && (
                    <span className="rounded bg-[--surface-2] px-1.5 py-0.5 text-[10px] font-medium">
                      {c.category[0].name}
                    </span>
                  )}
                  {c.complaint_author && (
                    <span className="truncate">{c.complaint_author}</span>
                  )}
                  <span>{timeAgo(c.created_at)}</span>
                </div>
              </div>
            </Link>
          ));
        })()}
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="section-label">Recent praise</h2>
        <Link
          href="/praise"
          className="text-[11px] font-medium text-muted hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(praises.data ?? []).length === 0 && (
          <p className="card border-dashed p-5 text-center text-sm text-muted sm:col-span-2">
            No praise yet — your campus staff would love one.
          </p>
        )}
        {((praises.data ?? []) as Praise[]).map((p) => (
          <div key={p.id} className="card p-3.5 text-sm">
            <p>{p.text}</p>
            <p className="mt-1 text-xs text-muted">
              {p.is_anonymous || !p.praise_author ? "Anonymous" : p.praise_author} ·{" "}
              {timeAgo(p.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}