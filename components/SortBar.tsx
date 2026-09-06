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
    <div className="flex items-center gap-1 rounded-xl bg-[--surface-2] p-1 text-sm">
      {options.map(({ key, label, Icon }) => {
        const active = sort === key;
        const href = key === "hot" ? base : `${base}${base.includes("?") ? "&" : "?"}sort=${key}`;
        return (
          <Link
            key={key}
            href={href}
            scroll={false}
            className={`tap flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${active ? "text-[--accent]" : ""}`} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}