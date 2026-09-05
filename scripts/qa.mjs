// QA harness — exercises the app end-to-end against a target base URL.
// Reads credentials from .env.local. Run: QA_AUTH_BYPASS=1 node scripts/qa.mjs
// Requires: a confirmed test user (QA_EMAIL/QA_PASS env or defaults below).

import fs from "node:fs";

function env(name) {
  const m = fs.readFileSync(".env.local", "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
  if (!m) throw new Error(`Missing ${name} in .env.local`);
  return m[1];
}

const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
const ANON_KEY = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const REF = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
const BASE = process.env.QA_BASE ?? "https://mss-feedback.vercel.app";
const QA_EMAIL = process.env.QA_EMAIL ?? "perftest111@gmail.com";
const QA_PASS = process.env.QA_PASS ?? "PerfTest@123";
const COOKIE = `sb-${REF}-auth-token`;

const results = [];
let session = null;

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const b64url = (s) => Buffer.from(s, "utf8").toString("base64url");

function cookieHeader(sess) {
  const json = JSON.stringify(sess);
  let encoded = "base64-" + b64url(json);
  const cookies = [];
  const chunks = [];
  while (encoded.length > 3180) {
    const head = encoded.slice(0, 3180 - 3);
    chunks.push(head);
    encoded = encoded.slice(head.length);
  }
  if (chunks.length === 0) {
    cookies.push(`${COOKIE}=${encoded}`);
  } else {
    chunks.push(encoded);
    cookies.push(`${COOKIE}=${chunks[0]}`);
    chunks.slice(1).forEach((c, i) => cookies.push(`${COOKIE}.${i}=${c}`));
  }
  return cookies.join("; ");
}

async function request(path, { method = "GET", cookie = null, body = null, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    redirect: "manual",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text };
}

function restHeaders({ key = null, auth = null } = {}) {
  const h = { apikey: key ?? ANON_KEY };
  if (key) h.authorization = `Bearer ${key}`;
  else if (auth) h.authorization = `Bearer ${auth}`;
  else h.authorization = `Bearer ${ANON_KEY}`;
  return h;
}

async function supabasePost(path, body, opts = {}, method = "POST") {
  const { prefer, ...rest } = opts;
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(prefer ? { prefer } : {}),
      ...restHeaders(rest),
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  return { status: res.status, data };
}

async function supabaseGet(path, opts = {}) {
  return supabasePost(path, {}, opts, "GET");
}

async function login() {
  const r = await supabasePost("/auth/v1/token?grant_type=password", {
    email: QA_EMAIL,
    password: QA_PASS,
  });
  if (r.data?.access_token) return r.data;
  const g = await supabasePost("/auth/v1/admin/generate_link", {
    type: "magiclink",
    email: QA_EMAIL,
  }, { key: env("SUPABASE_SERVICE_ROLE_KEY") });
  const link = g.data?.action_link ?? "";
  const hash = link.match(/token_hash=([^&]+)/)?.[1];
  if (!hash) throw new Error("magiclink failed");
  const v = await supabasePost("/auth/v1/verify", { type: "magiclink", token_hash: hash });
  return v.data;
}

async function main() {
  session = await login();
  if (!session.access_token) throw new Error("Login failed: " + JSON.stringify(session).slice(0, 120));
  const cookie = cookieHeader(session);
  const cookieSlug = cookie + "; inst_slug=nit-agartala";
  const uid = session.user?.id;
  const u = () => ({ auth: session.access_token });
  record("AUTH: test user login + session", true);

  const BYPASS = process.env.QA_AUTH_BYPASS === "1";

  // ---- AUTH & NAVIGATION (boards are public now) ----
  let r = await request("/nit-agartala");
  record("AUTH: anonymous board reachable without login", r.status === 200 && r.body.includes("Community board"), `status ${r.status}`);
  r = await request("/nit-agartala/mess");
  record("NAV: legacy /mess bounces to board", r.status === 307 && (r.headers.get("location") ?? "").endsWith("/nit-agartala"), `status ${r.status} loc ${r.headers.get("location")}`);
  r = await request("/mess");
  record("NAV: legacy top-level /mess -> home (picker)", r.status === 307, `status ${r.status} loc ${r.headers.get("location")}`);
  r = await request("/");
  record("NAV: / without cookie renders picker", r.status === 200 && r.body.includes("suggestion box"), `status ${r.status}`);
  r = await request("/", { cookie: cookieSlug });
  record("NAV: / with cookie returns to board", r.status === 200 && r.body.includes("Community board"), `status ${r.status} ${r.body.includes("Community board") ? "" : r.body.slice(0,120)}`);
  r = await request("/login");
  record("AUTH: /login renders public", r.status === 200);
  r = await request("/nit-agartala/complaints", { cookie: cookieSlug });
  record("NAV: /complaints redirects to home", r.status === 307 && r.headers.get("location") === "/", `status ${r.status} loc ${r.headers.get("location")}`);
  r = await request("/profile", { cookie: cookieSlug });
  record("NAV: /profile renders signed-in", r.status === 200, `status ${r.status}`);
  r = await request("/nit-agartala", { cookie: "sb-gmkzcxvgbhhvznbkxlae-auth-token=garbage; inst_slug=nit-agartala" });
  record("SEC: garbage cookie tolerated (open read)", r.status === 200, `status ${r.status}`);

  // ---- PROFILE ----
  const srv2 = env("SUPABASE_SERVICE_ROLE_KEY");
  const instRow = await supabaseGet(`/rest/v1/institutions?select=id&slug=eq.nit-agartala&limit=1`, u());
  const instId = instRow.data?.[0]?.id;
  record("DATA: institution resolvable", !!instId, instId ?? "");
  const profileRow = await supabaseGet(`/rest/v1/profiles?select=id&id=eq.${uid}`, { key: srv2 });
  if (!profileRow.data?.length) {
    await supabasePost("/rest/v1/profiles", { id: uid, full_name: "Perf Test", roll_no: "QA123", institution_id: instId }, { key: srv2 });
  }
  const upd = await supabasePost(`/rest/v1/profiles?id=eq.${uid}`, { roll_no: "QA123", institution_id: instId }, { key: srv2 }, "PATCH");
  record("PROFILE: patch via service role", upd.status === 204, `status ${upd.status}`);
  const pf = await supabaseGet(`/rest/v1/profiles?select=roll_no&id=eq.${uid}`, u());
  record("PROFILE: roll persisted & readable", pf.data?.[0]?.roll_no === "QA123", `status ${pf.status}`);

  // ---- COMPLAINTS (public suggestion box) ----
  {
    const olds = await supabaseGet(`/rest/v1/complaints?select=id&title=like.*QA test complaint*`, { key: srv2 });
    const ids = Array.isArray(olds.data) ? olds.data.map((r) => r.id) : [];
    for (const id of ids) {
      await supabasePost(`/rest/v1/complaint_upvotes?complaint_id=eq.${id}`, {}, { key: srv2 }, "DELETE");
      await supabasePost(`/rest/v1/complaint_comments?complaint_id=eq.${id}`, {}, { key: srv2 }, "DELETE");
    }
    for (const id of ids) await supabasePost(`/rest/v1/complaints?id=eq.${id}`, {}, { key: srv2 }, "DELETE");
  }
  const cat = (await supabaseGet(`/rest/v1/complaint_categories?select=id&institution_id=eq.${instId}&is_active=eq.true&limit=1`, u())).data?.[0]?.id;
  const mkComplaint = (n) =>
    supabasePost("/rest/v1/complaints", {
      user_id: uid, category_id: cat,
      title: `QA test complaint ${n} ${Date.now()}`,
      description: "QA automated test — will be cleaned up.", is_anonymous: false,
    }, u());
  const lastIds = async (n) => {
    const q = await supabaseGet(`/rest/v1/complaints?select=id,title&order=created_at.desc&limit=20`, u());
    return (q.data ?? [])
      .filter((r) => r.title?.startsWith("QA test complaint"))
      .map((r) => r.id)
      .slice(0, n);
  }
  const c1 = await mkComplaint("A");
  record("COMPLAINT: insert ok", c1.status === 201, `status ${c1.status} ${c1.message ?? ""}`);
  const c2 = await mkComplaint("B");
  const c3 = await mkComplaint("C");
  record("COMPLAINT: 2nd/3rd ok", c2.status === 201 && c3.status === 201);
  const c4 = await mkComplaint("D");
  record("COMPLAINT: 4th blocked (3/day limit)", c4.status === 403 || c4.status === 429, `status ${c4.status} ${c4.message ?? ""}`);
  const ids = await lastIds(3);
  const cid = ids[0];
  if (cid) {
    const rd = await supabaseGet(`/rest/v1/complaints?select=id,title&id=eq.${cid}`, u());
    record("SEC: complaint readable", rd.status === 200 && rd.data?.[0]?.title?.startsWith("QA test complaint"), `status ${rd.status}`);
    const uidLeak = await supabaseGet(`/rest/v1/complaints?select=user_id&id=eq.${cid}`, u());
    const uidLeaked = Array.isArray(uidLeak.data) && uidLeak.data.some((r) => r.user_id);
    record("SEC: complaint user_id not selectable", !uidLeaked, `status ${uidLeak.status}`);
    const anon = await supabaseGet(`/rest/v1/complaints?select=title,is_anonymous&id=eq.${cid}`, u());
    record("DATA: board fields readable anonymously", anon.status === 200 && anon.data?.[0]?.title?.startsWith("QA test complaint"));

    const upSelf = await supabasePost("/rest/v1/complaint_upvotes", { complaint_id: cid, user_id: uid }, u());
    record("UPVOTE: self-vote blocked by RLS (403)", upSelf.status === 403, `status ${upSelf.status}`);
    const foreign = await supabasePost("/rest/v1/complaints", {
      user_id: "61aef4a7-a744-4e99-b6f4-284254cc457f", institution_id: instId, category_id: cat,
      title: `QA foreign complaint ${Date.now()}`, description: "QA upvote target — cleaned up.", is_anonymous: true,
    }, { key: srv2 });
    if (foreign.status === 201) {
      const fq = await supabaseGet(`/rest/v1/complaints?select=id,title&title=like.*QA foreign complaint*&order=created_at.desc&limit=1`, { key: srv2 });
      const fcid = fq.data?.[0]?.id;
      if (fcid) {
        const up = await supabasePost("/rest/v1/complaint_upvotes", { complaint_id: fcid, user_id: uid }, u());
        record("UPVOTE: vote on someone else's complaint ok", up.status === 201, `status ${up.status} ${up.message ?? ""}`);
        const up2 = await supabasePost("/rest/v1/complaint_upvotes", { complaint_id: fcid, user_id: uid }, u());
        record("UPVOTE: duplicate blocked (409)", up2.status === 409, `status ${up2.status} ${up2.message ?? ""}`);
      }
    }
    const cm = await supabasePost("/rest/v1/complaint_comments", { complaint_id: cid, user_id: uid, body: "QA comment <script>alert(1)</script>" }, u());
    record("COMMENT: insert ok", cm.status === 201);
    if (cm.status === 201) {
      const page = await request(`/nit-agartala/complaints/${cid}`, { cookie: cookieSlug });
      record("NAV: complaint detail renders", page.status === 200, `status ${page.status}`);
      record("SEC: XSS escaped in HTML", !page.body.includes("<script>alert"), "");
    }
    await supabasePost(`/rest/v1/complaints?title=like.*QA foreign complaint*`, {}, { key: srv2 }, "DELETE");
    const del = await supabasePost(`/rest/v1/complaints?id=eq.${cid}`, {}, u(), "DELETE");
    record("COMPLAINT: delete own ok", del.status === 204);
  }

  // ---- ADMIN (creator-only; bypass opens it for testing) ----
  r = await request("/admin", { cookie: cookieSlug });
  if (BYPASS) {
    record("ADMIN: reachable under bypass", r.status === 200 && r.body.includes("Super admin"), `status ${r.status}`);
  } else {
    record("ADMIN: non-creator redirected away", r.status === 307 && r.headers.get("location") === "/", `status ${r.status} loc ${r.headers.get("location")}`);
  }
  r = await request("/admin/settings", { cookie: cookieSlug });
  const adminLegacy = r.status === 404 || r.status === 307;
  record("ADMIN: removed subpages gone", adminLegacy, `status ${r.status}`);

  const fails = results.filter((x) => !x.ok);
  console.log(`\n=== ${results.length - fails.length}/${results.length} passed ===`);
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error("QA aborted:", e.message);
  process.exit(2);
});