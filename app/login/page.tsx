"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconPlate, IconComplaint, IconArrowUp } from "@/components/icons";

function BrandPanel() {
  return (
    <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#161C15] p-10 text-[#EDF0E4] lg:flex">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 300px at 20% -10%, rgb(242 182 62 / 0.16), transparent 60%), radial-gradient(500px 300px at 90% 110%, rgb(127 169 139 / 0.14), transparent 60%)",
        }}
      />
      <div className="relative flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-[#F0AE3C] to-[#E8A020] text-[#241A04] shadow-[0_4px_16px_-4px_rgb(232_160_32/0.7)]">
          <IconPlate className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">
          Campus Feedback
        </span>
      </div>

      <div className="relative">
        <div className="anim-float mb-6 text-6xl" style={{ display: "inline-block" }}>
          🎯
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
          Every voice,
          <br />
          <span className="text-[#F2B63E]">on the board.</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#9DB39F]">
          Your college&apos;s public suggestion box. File a complaint, vote on
          the ones that matter, and let the whole campus see what&apos;s up.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm text-[#EDF0E4]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2B63E]/15 text-[#F2B63E]">
              <IconComplaint className="h-4 w-4" />
            </span>
            One open board for every college
          </div>
          <div className="flex items-center gap-3 text-sm text-[#EDF0E4]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7FA98B]/15 text-[#7FA98B]">
              🕶️
            </span>
            Post anonymously or under your name
          </div>
          <div className="flex items-center gap-3 text-sm text-[#EDF0E4]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B79BC6]/15 text-[#B79BC6]">
              <IconArrowUp className="h-4 w-4" />
            </span>
            Upvotes surface what matters most
          </div>
        </div>
      </div>

      <p className="relative text-xs text-[#6F8573]">
        Campus Feedback — your college, your voice
      </p>
    </div>
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
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#F0AE3C] to-[#E8A020] text-[#241A04] shadow-[0_6px_24px_-6px_rgb(232_160_32/0.6)]">
            <IconPlate className="h-7 w-7" strokeWidth={1.7} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Campus Feedback
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Your college&apos;s public suggestion box
          </p>
        </div>

        <div className="hidden lg:block mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome back 👋
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Boards are open — sign in to post, vote and comment.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="btn btn-ghost tap w-full !py-3 text-sm font-semibold disabled:opacity-60"
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

        <p className="mt-5 text-center text-xs text-muted">
          Sign in with any Google account · your voice, public &amp; counted
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}