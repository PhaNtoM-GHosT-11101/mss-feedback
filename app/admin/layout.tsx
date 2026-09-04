import Link from "next/link";
import { getCommittee } from "@/lib/admin-guard";
import { ThemeToggle } from "@/components/theme-provider";
import { IconStats, IconComplaint, IconProfile, IconMenu, IconLock, IconNote, IconPlate, IconShield, IconHome } from "@/components/icons";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Dashboard", Icon: IconStats },
  { href: "/admin/complaints", label: "Complaints", Icon: IconComplaint },
  { href: "/admin/users", label: "Users", Icon: IconProfile },
  { href: "/admin/menu", label: "Menu & Notices", Icon: IconMenu },
  { href: "/admin/settings", label: "Settings", Icon: IconLock },
  { href: "/admin/reports", label: "Reports", Icon: IconNote },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isAdmin } = await getCommittee();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface/70 backdrop-blur-xl lg:flex">
        <div className="px-5 pb-6 pt-7">
          <Link href="/admin" className="inline-block">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-[#4A7B5C] to-[#3E6B4F] text-white shadow-[0_3px_12px_-3px_rgb(62_107_79/0.6)]">
                <IconPlate className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-[15px] font-bold tracking-tight">
                  Campus Admin
                  {isAdmin && (
                    <span className="ml-1.5 align-middle rounded bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-accent-strong">
                      SUPER
                    </span>
                  )}
                </span>
                <span className="mt-0.5 text-[10px] font-medium text-muted">
                  {profile?.full_name}
                </span>
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="tap group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface2 hover:text-foreground"
            >
              <l.Icon className="h-[19px] w-[19px] text-muted group-hover:text-foreground" strokeWidth={1.9} />
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-4">
          <div className="flex items-center justify-between px-2">
            <ThemeToggle />
            <Link
              href="/"
              className="tap flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-surface2 hover:text-foreground"
            >
              <IconHome className="h-4 w-4" strokeWidth={1.9} />
              App
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-b from-[#4A7B5C] to-[#3E6B4F] text-white">
              <IconShield className="h-4 w-4" strokeWidth={1.9} />
            </span>
            <span className="font-display text-sm font-bold">
              Campus Admin
              {isAdmin && (
                <span className="ml-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-accent-strong">
                  SUPER
                </span>
              )}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs font-medium text-muted">
              ← App
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile nav chips */}
      <nav className="sticky top-[52px] z-30 border-b border-border/70 bg-background/90 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto no-scrollbar px-4 py-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6 lg:ml-60">{children}</main>
    </div>
  );
}
