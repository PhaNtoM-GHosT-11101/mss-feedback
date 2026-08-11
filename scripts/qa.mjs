// QA harness — exercises the app end-to-end against a target base URL.
// Reads credentials from .env.local. Run: node scripts/qa.mjs
// Requires: a confirmed test user (QA_EMAIL/QA_PASS env or defaults below).

import fs from "node:fs";
import { execSync } from "node:child_process";

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
const b64urlDecode = (s) => Buffer.from(s, "base64url").toString("utf8");

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

async function supabasePost(path, body, key = ANON_KEY) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      apikey: key,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, ...(await res.json()) };
}

async function supabaseGet(path, key = ANON_KEY) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: { authorization: `Bearer ${key}`, apikey: key },
  });
  return { status: res.status, data: await res.json() };
}

async function login() {
  const r = await supabasePost("/auth/v1/token?grant_type=password", {
    email: QA_EMAIL,
    password: QA_PASS,
  });
  if (r.access_token) return r;
  // fallback: magiclink flow
  const g = await supabasePost("/auth/v1/admin/generate_link", {
    type: "magiclink",
    email: QA_EMAIL,
  }, env("SUPABASE_SERVICE_ROLE_KEY"));
  const link = g.action_link ?? "";
  const hash = link.match(/token_hash=([^&]+)/)?.[1];
  if (!hash) throw new Error("magiclink failed");
  const v = await supabasePost("/auth/v1/verify", { type: "magiclink", token_hash: hash });
  return v;
}

async function main() {
  session = await login();
  if (!session.access_token) throw new Error("Login failed: " + JSON.stringify(session).slice(0, 120));
  const cookie = cookieHeader(session);
  const auth = `Bearer ${session.access_token}`;
  const uid = session.user?.id;
  record("AUTH: test user login + session", true);

  // ---- AUTH & NAVIGATION ----
  let r = await request("/");
  record("AUTH: anonymous / redirects to login", r.status === 307);
  r = await request("/login");
  record("AUTH: /login renders public", r.status === 200);
  r = await request("/", { cookie });
  record("AUTH: logged-in / renders", r.status === 200);
  for (const p of ["/complaints", "/praise", "/profile", "/complaints/new", "/onboard", "/admin"]) {
    const rr = await request(p, { cookie });
    const ok = p === "/admin" ? rr.status === 307 : rr.status === 200;
    record(`NAV: GET ${p}`, ok, `status ${rr.status}`);
  }
  r = await request("/auth/callback?code=bad&next=//evil.example/x", { cookie });
  record("SEC: open-redirect guard (next=//evil)", !r.headers.get("location")?.includes("evil"), r.headers.get("location") ?? "");
  r = await request("/", { cookie: "sb-gmkzcxvgbhhvznbkxlae-auth-token=garbage" });
  record("SEC: garbage cookie rejected", r.status === 307);

  // ---- PROFILE ----
  let ms = await supabaseGet(`/rest/v1/messes?select=id,name&is_active=eq.true`);
  const messId = ms.data?.[0]?.id;
  record("DATA: messes readable", !!messId);
  const upd = await supabasePost(`/rest/v1/profiles?id=eq.${uid}`, { roll_no: "QA123", mess_id: messId }, auth);
  record("PROFILE: update roll+mess", upd.status === 204, `status ${upd.status}`);
  const pf = await supabaseGet(`/rest/v1/profiles?select=roll_no,mess_id&id=eq.${uid}`, auth);
  record("PROFILE: values persisted", pf.data?.[0]?.roll_no === "QA123" && pf.data?.[0]?.mess_id === messId);

  // ---- COMPLAINTS ----
  const cat = (await supabaseGet(`/rest/v1/complaint_categories?select=id&is_active=eq.true&limit=1`)).data?.[0]?.id;
  const mkComplaint = (n) =>
    supabasePost("/rest/v1/complaints", {
      user_id: uid, mess_id: messId, category_id: cat,
      title: `QA test complaint ${n} ${Date.now()}`,
      description: "QA automated test — will be cleaned up.", is_anonymous: false,
    }, auth);
  const c1 = await mkComplaint("A");
  record("COMPLAINT: insert ok", c1.status === 201, `status ${c1.status} ${c1.message ?? ""}`);
  const cid = c1.status === 201 ? c1[0]?.id ?? c1.id : null;
  if (cid) {
    const c2 = await mkComplaint("B");
    const c3 = await mkComplaint("C");
    record("COMPLAINT: 2nd/3rd ok", c2.status === 201 && c3.status === 201);
    const c4 = await mkComplaint("D");
    record("COMPLAINT: 4th blocked (3/day limit)", c4.status === 403 || c4.status === 429, `status ${c4.status} ${c4.message ?? ""}`);
    const rd = await supabaseGet(`/rest/v1/complaints?select=title,user_id&id=eq.${cid}`);
    const pub = (await supabaseGet(`/rest/v1/complaints?select=id,user_id&id=eq.${cid}`)).data?.[0];
    const uidExposed = rd.data?.[0]?.user_id === uid;
    record("SEC: complaint readable", rd.data?.[0]?.title?.startsWith("QA test complaint"));
    record("SEC: user_id NOT exposed to anon reads", !pub?.user_id, `user_id=${pub?.user_id}`);
    const up = await supabasePost("/rest/v1/complaint_upvotes", { complaint_id: cid, user_id: uid }, auth);
    record("UPVOTE: insert ok", up.status === 201);
    const up2 = await supabasePost("/rest/v1/complaint_upvotes", { complaint_id: cid, user_id: uid }, auth);
    record("UPVOTE: duplicate blocked", up2.status === 409 || up2.status === 403);
    const cm = await supabasePost("/rest/v1/complaint_comments", { complaint_id: cid, user_id: uid, body: "QA comment <script>alert(1)</script>" }, auth);
    record("COMMENT: insert ok", cm.status === 201);
    const cmRd = await supabaseGet(`/rest/v1/complaint_comments?select=body&complaint_id=eq.${cid}`);
    const body = cmRd.data?.[0]?.body ?? "";
    if (cm.status === 201) {
      const page = await request(`/complaints/${cid}`, { cookie });
      record("NAV: complaint detail renders", page.status === 200);
      record("SEC: XSS escaped in HTML", page.body.includes("&lt;script&gt;") || !page.body.includes("<script>alert"), "");
    }
    const fl = await supabasePost("/rest/v1/complaint_flags", { complaint_id: cid, user_id: uid }, auth);
    record("FLAG: insert ok", fl.status === 201, `status ${fl.status}`);
    const fl2 = await supabasePost("/rest/v1/complaint_flags", { complaint_id: cid, user_id: uid }, auth);
    record("FLAG: duplicate blocked", fl2.status === 409 || fl2.status === 403);
    const del = await supabasePost(`/rest/v1/complaints?id=eq.${cid}`, {}, { ...authReplaced(auth), "X-HTTP-Method-Override": "DELETE" });
    record("COMPLAINT: delete own ok", del.status === 204);
  }

  // ---- RATING ----
  const meal = (await supabaseGet(`/rest/v1/meals?select=id&is_active=eq.true&limit=1`)).data?.[0]?.id;
  if (meal) {
    const rt = await supabasePost("/rest/v1/ratings", {
      user_id: uid, meal_id: meal, stars: 4, rating_date: new Date().toISOString().slice(0, 10),
    }, auth);
    const mealOpen = rt.status === 201; // window-dependent
    record(`RATING: insert ${mealOpen ? "allowed (window open)" : "blocked (window closed)"}`, true, `status ${rt.status} ${rt.message ?? ""}`);
    const mine = await supabasePost(`/rest/v1/rpc/my_ratings`, {}, auth);
    record("RPC: my_ratings works", Array.isArray(mine));
  }

  // ---- PRAISE ----
  const pr = await supabasePost("/rest/v1/praises", {
    user_id: uid, text: "QA automated praise — kitchen is great!", is_anonymous: false,
  }, auth);
  record("PRAISE: insert ok", pr.status === 201);
  const prRd = await supabaseGet(`/rest/v1/praises?select=praise_author,user_id&text=like.*QA automated praise*`);
  record("SEC: praise hides user_id, shows author", prRd.data?.[0]?.praise_author === "QA Test" && !prRd.data?.[0]?.user_id, JSON.stringify(prRd.data?.[0]));

  // ---- MENU ----
  const mi = await supabaseGet(`/rest/v1/menu_items?select=id&limit=1`);
  record("DATA: menu_items readable", mi.status === 200);

  // ---- ADMIN (grant temp) ----
  const srv = env("SUPABASE_SERVICE_ROLE_KEY");
  const adminAdded = await supabasePost("/rest/v1/admin_members", { user_id: uid, role: "admin" }, srv);
  const wasAdmin = adminAdded.status === 201;
  if (wasAdmin) {
    for (const p of ["/admin", "/admin/complaints", "/admin/users", "/admin/menu", "/admin/settings", "/admin/reports"]) {
      const rr = await request(p, { cookie });
      record(`ADMIN: GET ${p}`, rr.status === 200, `status ${rr.status}`);
    }
  }
  await supabasePost("/rest/v1/rpc/delete_admin_member", { p_user_id: uid }, srv).catch(() => {});
  await supabaseGet(`/rest/v1/admin_members?user_id=eq.${uid}`, srv).then(async (x) => {
    if (x.data?.length) {
      const id = x.data[0].id;
      await supabasePost(`/rest/v1/admin_members?id=eq.${id}`, {}, { ...authReplaced(srv), "X-HTTP-Method-Override": "DELETE" });
    }
  });
  const adminAfter = await request("/admin", { cookie });
  record("ADMIN: access revoked after removal", adminAfter.status === 307, `status ${adminAfter.status}`);

  // ---- BAN ----
  const banUser = await supabasePost("/rest/v1/profiles?id=eq." + uid, { is_banned: true }, srv);
  if (banUser.status === 204) {
    const home = await request("/", { cookie });
    record("BAN: home shows suspended screen", home.status === 200 && home.body.includes("Account suspended"));
    const block = await supabasePost("/rest/v1/complaints", {
      user_id: uid, mess_id: messId, category_id: cat, title: "QA banned insert", description: "should fail",
    }, auth);
    record("BAN: inserts blocked by RLS", block.status === 403, `status ${block.status}`);
  }
  await supabasePost("/rest/v1/profiles?id=eq." + uid, { is_banned: false }, srv);

  const fails = results.filter((x) => !x.ok);
  console.log(`\n=== ${results.length - fails.length}/${results.length} passed ===`);
  process.exit(fails.length ? 1 : 0);
}

function authReplaced(auth) {
  return { authorization: auth };
}

main().catch((e) => {
  console.error("QA aborted:", e.message);
  process.exit(2);
});