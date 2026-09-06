import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { IconArrowUp, IconPin } from "@/components/icons";
import { timeAgo } from "@/lib/format";
import type { FeedItem } from "@/lib/feed";

const MEAL_SESSION_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

export default function FeedCard({ item }: { item: FeedItem }) {
  const slug = item.institution?.slug;
  const href = slug ? `/${slug}/complaints/${item.id}` : `/complaints/${item.id}`;
  const commentCount = item.comments?.[0]?.count ?? 0;
  const collegeName = item.institution?.name;
  const categoryName = item.category?.name;
  const meal = item.meal_session ? MEAL_SESSION_LABEL[item.meal_session] : null;
  const hasPhotos = !!item.photo_urls && item.photo_urls.length > 0;
  const isMess = !!item.category?.is_mess;

  return (
    <Link
      href={href}
      className="card card-hover group flex items-stretch overflow-hidden"
    >
      {/* Vote rail (Reddit-style, desktop) */}
      <div className="hidden w-12 shrink-0 flex-col items-center gap-0.5 self-stretch border-r border-border/60 bg-transparent py-2.5 transition-colors duration-150 group-hover:bg-surface2/50 sm:flex">
        <IconArrowUp className="h-4 w-4 text-zinc-400 transition group-hover:text-accent" />
        <span className="mt-0.5 text-[15px] font-bold leading-none tabular-nums text-zinc-700 dark:text-zinc-200">
          {item.upvote_count}
        </span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
          votes
        </span>
      </div>

      {/* Post body */}
      <div className="min-w-0 flex-1 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px]">
          {item.is_pinned && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <IconPin className="h-3.5 w-3.5" /> Pinned
            </span>
          )}
          {collegeName && (
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
              {collegeName}
            </span>
          )}
          {categoryName && (
            <span className="text-zinc-500 dark:text-zinc-400">
              {isMess ? "🍽 " : ""}
              {categoryName}
            </span>
          )}
          <span aria-hidden className="text-zinc-300 dark:text-zinc-600">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">{timeAgo(item.created_at)}</span>
        </div>

        <p className="mt-1 text-[15px] font-semibold leading-snug text-foreground">
          {item.title}
        </p>

        {item.description && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {item.description}
          </p>
        )}

        {(meal || hasPhotos) && (
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-zinc-500 dark:text-zinc-400">
            {meal && <span className="rounded-md bg-surface2 px-1.5 py-0.5 font-medium text-zinc-600 dark:text-zinc-300">{meal}</span>}
            {hasPhotos && <span aria-label="Has photos">📷</span>}
          </div>
        )}

        {/* Action row */}
        <div className="mt-2 flex items-center gap-4 text-[12.5px] text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition hover:bg-surface2">
            <MessageCircle className="h-[15px] w-[15px]" />
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </span>
          <span className="sm:hidden inline-flex items-center gap-1 rounded-md px-1.5 py-0.5">
            <IconArrowUp className="h-3.5 w-3.5" />
            {item.upvote_count}
          </span>
        </div>
      </div>
    </Link>
  );
}