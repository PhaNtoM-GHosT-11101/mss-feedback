"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";
import {
  IconArrowUp,
  IconMessageSquare,
  IconPin,
} from "@/components/icons";
import SaveButton from "./SaveButton";
import ShareMenu from "./ShareMenu";
import ReportButton from "./ReportButton";
import { timeAgo } from "@/lib/format";
import type { FeedItem } from "@/lib/feed";

const MEAL_SESSION_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const slug = item.institution?.slug;
  const href = slug ? `/${slug}/complaints/${item.id}` : `/complaints/${item.id}`;
  const commentCount = item.comments?.[0]?.count ?? 0;
  const collegeName = item.institution?.name;
  const categoryName = item.category?.name;
  const meal = item.meal_session ? MEAL_SESSION_LABEL[item.meal_session] : null;
  const photos = item.photo_urls ?? [];
  const isMess = !!item.category?.is_mess;

  const open = () => router.push(href);

  const onClick = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("a, button")) return;
    open();
  };
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  const metaItem = "text-[12.5px] text-muted";

  return (
    <article
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKey}
      aria-label={`${item.title} — open complaint`}
      className="group flex cursor-pointer items-stretch gap-2 px-1 py-4 outline-none transition hover:bg-surface2/60 focus-visible:rounded-lg sm:gap-3"
    >
      {/* Vote rail */}
      <div className="hidden w-12 shrink-0 flex-col items-center gap-1 self-start border-l-2 border-transparent py-0.5 transition group-hover:border-accent sm:flex">
        <IconArrowUp className="h-4 w-4 text-muted transition group-hover:text-accent-ink" />
        <span className="mt-0.5 text-[15px] font-bold leading-none tabular-nums text-foreground">
          {item.upvote_count}
        </span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-muted">
          votes
        </span>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 pr-1">
        {/* Meta — college badge + name, category, time */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {item.is_pinned && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <IconPin className="h-3.5 w-3.5" /> Pinned
            </span>
          )}
          {collegeName && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface2 px-1.5 py-0.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-accent text-[8px] font-bold text-white">
                {initialsFor(collegeName)}
              </span>
              <span className="text-[12px] font-semibold text-foreground">{collegeName}</span>
            </span>
          )}
          {categoryName && (
            <span className={`${metaItem} inline-flex items-center gap-1`}>
              {isMess ? "🍽 " : ""}
              {categoryName}
            </span>
          )}
          <span aria-hidden className={metaItem}>
            ·{timeAgo(item.created_at)}
          </span>
        </div>

        {/* Title */}
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 block text-[15px] font-semibold leading-snug text-foreground transition group-hover:text-accent-ink"
        >
          {item.title}
        </Link>

        {item.description && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            {item.description}
          </p>
        )}

        {(meal || photos.length > 0) && (
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-muted">
            {meal && (
              <span className="rounded-md bg-surface2 px-1.5 py-0.5 font-medium text-zinc-600 dark:text-zinc-300">
                {meal}
              </span>
            )}
            {photos.length > 0 && (
              <span className="flex items-center gap-1.5">
                {photos.slice(0, 3).map((p) => (
                  <Image
                    key={p}
                    src={p}
                    alt=""
                    width={96}
                    height={96}
                    sizes="40px"
                    loading="lazy"
                    className="h-10 w-10 rounded-md border border-border object-cover"
                  />
                ))}
              </span>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="mt-2 flex items-center gap-2 text-[12.5px] text-muted">
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="tap inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium transition hover:bg-surface2 hover:text-foreground"
          >
            <IconMessageSquare className="h-[15px] w-[15px]" />
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </Link>

          <button
            type="button"
            onClick={open}
            className="tap inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium sm:hidden"
            aria-label={`${item.upvote_count} votes — open complaint`}
          >
            <IconArrowUp className="h-[15px] w-[15px]" />
            {item.upvote_count}
          </button>

          <SaveAction complaintId={item.id} />
          <SharedActions complaintId={item.id} href={href} title={item.title} />
        </div>
      </div>
    </article>
  );
}

function SaveAction({ complaintId }: { complaintId: string }) {
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <SaveButton complaintId={complaintId} />
    </span>
  );
}

function SharedActions({
  complaintId,
  href,
  title,
}: {
  complaintId: string;
  href: string;
  title: string;
}) {
  return (
    <>
      <span onClick={(e) => e.stopPropagation()}>
        <ShareMenu href={href} title={title} />
      </span>
      <span onClick={(e) => e.stopPropagation()}>
        <ReportButton complaintId={complaintId} />
      </span>
    </>
  );
}