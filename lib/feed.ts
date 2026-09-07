import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category } from "@/lib/types";

export type FeedSort = "hot" | "top" | "new";

export type FeedItem = {
  id: string;
  title: string;
  description: string;
  upvote_count: number;
  created_at: string;
  is_pinned: boolean;
  is_anonymous: boolean;
  complaint_author: string | null;
  meal_session: string | null;
  photo_urls: string[] | null;
  category_id: string | null;
  category: { id: string; name: string; is_mess: boolean | null } | null;
  comments: { count: number }[] | null;
  institution: { id: string; name: string; slug: string } | null;
};

/**
 * Reddit-style "hot" score. With only upvotes (no downvotes) the sign term is
 * dropped; newer + better-upvoted posts float above older + less-upvoted ones.
 */
export function hotScore(upvotes: number, createdAt: string): number {
  const epochSeconds = new Date(createdAt).getTime() / 1000;
  const s = Math.max(upvotes, 0);
  return Math.log10(Math.max(s + 1, 1)) + (epochSeconds - 1134028003) / 45000;
}

export function sortComplaints(list: FeedItem[], sort: FeedSort): FeedItem[] {
  return [...list].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    if (sort === "new") return b.created_at.localeCompare(a.created_at);
    if (sort === "top") return b.upvote_count - a.upvote_count || b.created_at.localeCompare(a.created_at);
    return (
      hotScore(b.upvote_count, b.created_at) - hotScore(a.upvote_count, a.created_at)
    );
  });
}

const FEED_SELECT = `
  id, title, description, upvote_count, created_at, is_pinned, is_anonymous,
  complaint_author, meal_session, photo_urls, category_id,
  category:complaint_categories(id, name, is_mess),
  institution:institutions(id, name, slug),
  comments:complaint_comments(count)
`;

/** Every active complaint across all colleges (r/all-style). */
export const getGlobalFeed = unstable_cache(
  async (): Promise<FeedItem[]> => {
    const db = createAdminClient();
    const { data } = await db
      .from("complaints")
      .select(FEED_SELECT)
      .eq("is_flagged", false)
      .order("created_at", { ascending: false })
      .limit(500);
    return (data ?? []) as unknown as FeedItem[];
  },
  ["global-feed"],
  { revalidate: 30, tags: ["complaint"] },
);

export async function getCollegeBoard(
  institutionId: string,
): Promise<{ categories: Category[]; complaints: FeedItem[] }> {
  const db = createAdminClient();
  const [cats, complaints] = await Promise.all([
    db
      .from("complaint_categories")
      .select("*")
      .eq("institution_id", institutionId)
      .eq("is_active", true)
      .order("sort_order"),
    db
      .from("complaints")
      .select(FEED_SELECT)
      .eq("institution_id", institutionId)
      .eq("is_flagged", false)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  return {
    categories: (cats?.data ?? []) as Category[],
    complaints: (complaints?.data ?? []) as unknown as FeedItem[],
  };
}

export const searchComplaints = unstable_cache(
  async (q: string): Promise<FeedItem[]> => {
    const db = createAdminClient();
    const term = `%${q}%`;
    const { data } = await db
      .from("complaints")
      .select(FEED_SELECT)
      .or(`title.ilike.${term},description.ilike.${term}`)
      .eq("is_flagged", false)
      .order("created_at", { ascending: false })
      .limit(60);
    return (data ?? []) as unknown as FeedItem[];
  },
  ["complaint-search"],
  { revalidate: 30, tags: ["complaint"] },
);