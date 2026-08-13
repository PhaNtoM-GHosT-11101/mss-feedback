"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBell, IconCheck } from "./icons";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  complaint_id: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationBell({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let userId: string | null = null;
    async function load() {
      const supabase = createClient();
      let query = supabase
        .from("notifications")
        .select("id, type, title, body, complaint_id, read, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (userId) query = query.eq("user_id", userId);
      const { data } = await query;
      if (cancelled || !data) return;
      setItems(data as unknown as Notification[]);
      setUnread((data as unknown as Notification[]).filter((n) => !n.read).length);
    }
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      load();
    })();
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", items.filter((n) => !n.read).map((n) => n.id));
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="tap relative flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-foreground transition hover:bg-border"
      >
        <IconBell className="h-[18px] w-[18px]" strokeWidth={1.9} />
        {unread > 0 && (
          <span className="anim-pop-in absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[--meal-lunch] px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-scale-in absolute right-0 top-10 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-xs font-bold">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-[--sage] hover:underline"
              >
                <IconCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-muted">
                No notifications yet.
              </p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setOpen(false);
                  if (n.complaint_id) router.push(`/complaints/${n.complaint_id}`);
                }}
                className={`block w-full border-b border-border/60 px-4 py-3 text-left transition hover:bg-surface2 ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  {n.type === "complaint_resolved" && <span>✅</span>}
                  {n.type === "announcement" && <span>📢</span>}
                  {n.type === "system" && <span>🔔</span>}
                  {n.title}
                  {!n.read && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[--accent]" />}
                </p>
                {n.body && <p className="mt-0.5 truncate text-[11px] text-muted">{n.body}</p>}
                <p className="mt-0.5 text-[10px] text-muted/70">{timeAgo(n.created_at)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}