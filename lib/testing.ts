/**
 * Testing bypass switch.
 *
 * When NEXT_PUBLIC_AUTH_BYPASS=1 the app skips the Google login wall so it can
 * be browsed without an account. Server-guard redirects become no-ops and pages
 * render a null user. Set it in `.env.local` (local) and the Vercel env for the
 * environment you want to test; leave unset in production.
 */
export const AUTH_BYPASS_ENABLED = process.env.NEXT_PUBLIC_AUTH_BYPASS === "1";
