import NavBar from "@/components/NavBar";
import FeedCard from "@/components/FeedCard";
import { IconSearch } from "@/components/icons";
import { searchComplaints } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchComplaints(query) : [];

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-2 md:px-6">
        <form action="/search" method="get" role="search">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="q"
              defaultValue={query}
              autoFocus
              placeholder="Search every complaint on REVERB…"
              aria-label="Search complaints"
              className="input h-12 w-full bg-card pl-10 text-[15px] shadow-sm"
            />
          </div>
        </form>

        {!query ? (
          <p className="mt-10 text-center text-sm text-muted">
            Search across every college board — titles and descriptions.
          </p>
        ) : results.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm font-semibold">No results for “{query}”</p>
            <p className="mt-1 text-[13px] text-muted">
              Try a different word — hashtags and college names work too.
            </p>
          </div>
        ) : (
          <>
            <p className="section-label mt-6 mb-3">
              {results.length} result{results.length > 1 ? "s" : ""} for “{query}”
            </p>
            <div className="divide-y divide-border rounded-xl bg-card overflow-hidden border border-border">
              {results.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}