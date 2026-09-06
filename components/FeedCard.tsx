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

  return (
    <Link
      href={href}
      className="card card-hover group flex items-start gap-3 p-3.5"
    >
      <div className="flex shrink-0 flex-col items-center rounded-lg bg-[--surface-2] px-2.5 py-1.5">
        <span className="text-sm font-bold leading-tight">{item.upvote_count}</span>
        <IconArrowUp className="h-3 w-3 text-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {item.is_pinned && <IconPin className="h-3.5 w-3.5 shrink-0 text-[--accent]" />}
          <p className="text-sm font-medium leading-snug text-foreground">{item.title}</p>
        </div>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
          {slug && item.institution?.name && (
            <span className="rounded-md bg-[--surface-2] px-1.5 py-0.5 font-medium text-[--accent-ink]">
              {item.institution.name}
            </span>
          )}
          {item.category?.name && (
            <span className="rounded-md bg-[--accent-soft] px-1.5 py-0.5 font-medium text-[--accent-ink]">
              {item.category.is_mess ? "🍽 " : ""}
              {item.category.name}
            </span>
          )}
          {item.meal_session && MEAL_SESSION_LABEL[item.meal_session] && (
            <span className="rounded-md bg-[--surface-2] px-1.5 py-0.5">
              {MEAL_SESSION_LABEL[item.meal_session]}
            </span>
          )}
          <span className="hidden items-center gap-1 sm:flex">
            <MessageCircle className="h-3 w-3" />
            {commentCount}
          </span>
          <span>{timeAgo(item.created_at)}</span>
          {item.photo_urls && item.photo_urls.length > 0 && <span>📷</span>}
        </div>
      </div>
    </Link>
  );
}