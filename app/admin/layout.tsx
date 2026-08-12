import Link from "next/link";
import { getCommittee } from "@/lib/admin-guard";
import { ThemeToggle } from "@/components/theme-provider";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/menu", label: "Menu & Notices" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isAdmin } = await getCommittee();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <Link href="/admin" className="text-sm font-bold">
              MSS Admin {isAdmin && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">SUPER</span>}
            </Link>
            <p className="text-[11px] text-gray-400">{profile?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-700">
              ← Back to app
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav className="sticky top-[57px] z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto no-scrollbar px-4 py-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
