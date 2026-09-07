import Link from "next/link";
import { Flame, ArrowUp, Clock } from "lucide-react";
import type { FeedSort } from "@/lib/feed";

const options: { key: FeedSort; label: string; Icon: typeof Flame }[] = [
  { key: "hot", label: "Hot", Icon: Flame },
  { key: "top", label: "Top", Icon: ArrowUp },
  { key: "new", label: "New", Icon: Clock },
];

export default function SortBar({ sort, base }: { sort: FeedSort; base: string }) {
  return (
    <div className="flex items-center gap-6 border-b border-border">
      {options.map(({ key, label, Icon }) => {
        const active = sort === key;
        const href = key === "hot" ? base : `${base}${base.includes("?") ? "&" : "?"}sort=${key}`;
        return (
          <Link
            key={key}
            href={href}
            scroll={false}
            className={`sort-tab tap flex items-center gap-1.5 -mb-px ${
              active ? "sort-tab-active" : ""
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 ${active ? "text-accent" : "text-zinc-400 dark:text-zinc-500"}`}
              strokeWidth={active ? 2.4 : 1.9}
            />
            {label}
          </Link>
        );
      })}
    </div>
  );
}