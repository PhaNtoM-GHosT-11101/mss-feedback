"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconArrowUp, IconCheck } from "@/components/icons";

function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-12 w-12 rounded-2xl" : "h-10 w-10 rounded-xl";
  const icon = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span
      className={`flex ${cls} items-center justify-center bg-accent shadow-[0_6px_20px_-6px_rgb(255_69_0/0.6)]`}
    >
      <IconArrowUp className={`${icon} text-white`} strokeWidth={2.6} />
    </span>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const err = new URLSearchParams(window.location.search).get("error");
      return err === "auth" ? "Sign-in failed. Please try again." : null;
    } catch {
      return null;
    }
  });

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandMark size="lg" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Campus Feedback</h1>
          <p className="mt-1.5 text-sm text-muted">
            Your college&apos;s public suggestion box
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-lg font-bold tracking-tight">Sign in</h2>
          <p className="mt-1 text-[13px] text-muted">
            Boards are open — sign in to post, vote and comment.
          </p>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="btn btn-ghost tap mt-5 w-full py-3 text-sm font-semibold disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              or browse as a guest
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Link
            href="/"
            className="btn btn-accent mt-4 w-full py-3 text-sm font-semibold"
          >
            Explore boards — no account needed
          </Link>
        </div>

        <div className="mt-6 space-y-2.5">
          <p className="inline-flex items-center gap-2.5 text-[13px] font-medium text-zinc-600 dark:text-zinc-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <IconCheck className="h-3 w-3 text-accent-strong" strokeWidth={3} />
            </span>
            Every college board is free to read
          </p>
          <p className="inline-flex items-center gap-2.5 text-[13px] font-medium text-zinc-600 dark:text-zinc-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <IconCheck className="h-3 w-3 text-accent-strong" strokeWidth={3} />
            </span>
            Upvote what matters to you
          </p>
          <p className="inline-flex items-center gap-2.5 text-[13px] font-medium text-zinc-600 dark:text-zinc-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <IconCheck className="h-3 w-3 text-accent-strong" strokeWidth={3} />
            </span>
            Post anonymously — your name stays hidden
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-svh bg-background px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}