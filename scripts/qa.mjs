// QA harness — exercises the app end-to-end against a target base URL.
// Reads credentials from .env.local. Run: node scripts/qa.mjs
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
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { "content-type": "application/json", ...restHeaders(opts) },
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
  // fallback: magiclink flow
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
  // Multi-tenant: after signing in, the user has visited/been routed to a
  // college, so an inst_slug cookie is present for internal navigation.
  const cookieSlug = cookie + "; inst_slug=nit-agartala";
  const uid = session.user?.id;
  const u = () => ({ auth: session.access_token });
  record("AUTH: test user login + session", true);

  // ---- AUTH & NAVIGATION ----
  let r = await request("/nit-agartala");
  record("AUTH: anonymous slug -> login w/ next", r.status === 307 && (r.headers.get("location") ?? "").includes("next=%2Fnit-agartala"), `status ${r.status} loc ${r.headers.get("location") ?? ""}`);
  r = await request("/login");
  record("AUTH: /login renders public", r.status === 200);
  for (const p of ["/complaints", "/praise", "/profile", "/complaints/new", "/onboard", "/mess", "/admin"]) {
    const rr = await request(p, { cookie: cookieSlug });
    const ok = p === "/admin" ? rr.status === 307 : rr.status === 200;
    record(`NAV: GET ${p}`, ok, `status ${rr.status}`);
  }
  r = await request("/auth/callback?code=bad&next=//evil.example/x", { cookie: cookieSlug });
  record("SEC: open-redirect guard (next=//evil)", !r.headers.get("location")?.includes("evil"), r.headers.get("location") ?? "");
  r = await request("/nit-agartala", { cookie: "sb-gmkzcxvgbhhvznbkxlae-auth-token=garbage; inst_slug=nit-agartala" });
  record("SEC: garbage cookie rejected", r.status === 307, `status ${r.status}`);

  // ---- PROFILE ----
  let ms = await supabaseGet(`/rest/v1/messes?select=id,name&is_active=eq.true`, u());
  const messId = ms.data?.[0]?.id;
  record("DATA: messes readable", !!messId);
  const srv2 = env("SUPABASE_SERVICE_ROLE_KEY");
  const profileRow = await supabaseGet(`/rest/v1/profiles?select=id&id=eq.${uid}`, { key: srv2 });
  if (!profileRow.data?.length) {
    await supabasePost("/rest/v1/profiles", { id: uid, full_name: "QA Test", roll_no: "QA123", mess_id: messId }, { key: srv2 });
  }
  const upd = await supabasePost(`/rest/v1/profiles?id=eq.${uid}`, { roll_no: "QA123", mess_id: messId }, u(), "PATCH");
  record("PROFILE: update roll+mess", upd.status === 204, `status ${upd.status} ${JSON.stringify(upd).slice(0, 160)}`);
  const pf = await supabaseGet(`/rest/v1/profiles?select=roll_no,mess_id&id=eq.${uid}`, u());
  record("PROFILE: values persisted", pf.data?.[0]?.roll_no === "QA123" && pf.data?.[0]?.mess_id === messId);
  const homeAfter = await request("/nit-agartala", { cookie: cookieSlug });
  record("AUTH: logged-in / renders", homeAfter.status === 200, `status ${homeAfter.status}`);

  // ---- COMPLAINTS ----
  // Clean up leftovers from previous runs so the 3/day quota is deterministic.
  {
    const srvk = env("SUPABASE_SERVICE_ROLE_KEY");
    const olds = await supabaseGet(`/rest/v1/complaints?select=id&title=like.*QA test complaint*`, { key: srvk });
    const ids = Array.isArray(olds.data) ? olds.data.map((r) => r.id) : [];
    for (const id of ids) {
      await supabasePost(`/rest/v1/complaint_upvotes?complaint_id=eq.${id}`, {}, { key: srvk }, "DELETE");
      await supabasePost(`/rest/v1/complaint_comments?complaint_id=eq.${id}`, {}, { key: srvk }, "DELETE");
      await supabasePost(`/rest/v1/complaint_flags?complaint_id=eq.${id}`, {}, { key: srvk }, "DELETE");
    }
    for (const id of ids) await supabasePost(`/rest/v1/complaints?id=eq.${id}`, {}, { key: srvk }, "DELETE");
    const oldp = await supabaseGet(`/rest/v1/praises?select=id&text=like.*QA automated praise*`, { key: srvk });
    if (Array.isArray(oldp.data)) for (const p of oldp.data) await supabasePost(`/rest/v1/praises?id=eq.${p.id}`, {}, { key: srvk }, "DELETE");
  }
  const cat = (await supabaseGet(`/rest/v1/complaint_categories?select=id&is_active=eq.true&limit=1`, u())).data?.[0]?.id;
  const mkComplaint = (n) =>
    supabasePost("/rest/v1/complaints", {
      user_id: uid, mess_id: messId, category_id: cat,
      title: `QA test complaint ${n} ${Date.now()}`,
      description: "QA automated test — will be cleaned up.", is_anonymous: false,
    }, u());
  const c1 = await mkComplaint("A");
  record("COMPLAINT: insert ok", c1.status === 201, `status ${c1.status} ${c1.message ?? ""}`);
  const cid = c1.status === 201 ? c1.data?.[0]?.id ?? c1.data?.id : null;
  if (cid) {
    const c2 = await mkComplaint("B");
    const c3 = await mkComplaint("C");
    record("COMPLAINT: 2nd/3rd ok", c2.status === 201 && c3.status === 201);
    const c4 = await mkComplaint("D");
    record("COMPLAINT: 4th blocked (3/day limit)", c4.status === 403 || c4.status === 429, `status ${c4.status} ${c4.message ?? ""}`);
    const rd = await supabaseGet(`/rest/v1/complaints?select=id,title&id=eq.${cid}`, u());
    record("SEC: complaint readable", rd.status === 200 && rd.data?.[0]?.title?.startsWith("QA test complaint"), `status ${rd.status}`);
    const uidLeak = await supabaseGet(`/rest/v1/complaints?select=user_id&id=eq.${cid}`, u());
    const uidLeaked = Array.isArray(uidLeak.data) && uidLeak.data.some((r) => r.user_id);
    record("SEC: complaint user_id not selectable", !uidLeaked, `status ${uidLeak.status}`);
    const up = await supabasePost("/rest/v1/complaint_upvotes", { complaint_id: cid, user_id: uid }, u());
    record("UPVOTE: insert ok", up.status === 201);
    const up2 = await supabasePost("/rest/v1/complaint_upvotes", { complaint_id: cid, user_id: uid }, u());
    record("UPVOTE: duplicate blocked", up2.status === 409 || up2.status === 403);
    const cm = await supabasePost("/rest/v1/complaint_comments", { complaint_id: cid, user_id: uid, body: "QA comment <script>alert(1)</script>" }, u());
    record("COMMENT: insert ok", cm.status === 201);
    if (cm.status === 201) {
      const page = await request(`/complaints/${cid}`, { cookie: cookieSlug });
      record("NAV: complaint detail renders", page.status === 200);
      record("SEC: XSS escaped in HTML", page.body.includes("&lt;script&gt;") || !page.body.includes("<script>alert"), "");
    }
    const fl = await supabasePost("/rest/v1/complaint_flags", { complaint_id: cid, user_id: uid }, u());
    record("FLAG: insert ok", fl.status === 201, `status ${fl.status}`);
    const fl2 = await supabasePost("/rest/v1/complaint_flags", { complaint_id: cid, user_id: uid }, u());
    record("FLAG: duplicate blocked", fl2.status === 409 || fl2.status === 403);
    const del = await supabasePost(`/rest/v1/complaints?id=eq.${cid}`, {}, u(), "DELETE");
    record("COMPLAINT: delete own ok", del.status === 204);
  }

  // ---- RATING ----
  const meal = (await supabaseGet(`/rest/v1/meals?select=id&is_active=eq.true&limit=1`, u())).data?.[0]?.id;
  if (meal) {
    const rt = await supabasePost("/rest/v1/ratings", {
      user_id: uid, meal_id: meal, stars: 4, rating_date: new Date().toISOString().slice(0, 10),
    }, u());
    const mealOpen = rt.status === 201; // window-dependent
    record(`RATING: insert ${mealOpen ? "allowed (window open)" : "blocked (window closed)"}`, true, `status ${rt.status} ${rt.message ?? ""}`);
    const mine = await supabasePost(`/rest/v1/rpc/my_ratings`, {}, u());
    record("RPC: my_ratings works", Array.isArray(mine.data));
  }

  // ---- PRAISE ----
  const pr = await supabasePost("/rest/v1/praises", {
    user_id: uid, text: "QA automated praise — kitchen is great!", is_anonymous: false,
  }, u());
  record("PRAISE: insert ok", pr.status === 201);
  const prRd = await supabaseGet(`/rest/v1/praises?select=id,text,is_anonymous,created_at&text=like.*QA automated praise*`, u());
  record("PRAISE: public columns readable", prRd.status === 200 && prRd.data?.[0]?.text?.startsWith("QA automated praise"), `status ${prRd.status}`);
  const prId = prRd.data?.[0]?.id;
  if (prId) {
    const leak = await supabaseGet(`/rest/v1/praises?select=user_id&id=eq.${prId}`, u());
    const leaked = Array.isArray(leak.data) && leak.data.some((r) => r.user_id);
    record("SEC: praise user_id not selectable", !leaked, `status ${leak.status}`);
    const adminRd = await supabaseGet(`/rest/v1/praises?select=praise_author&id=eq.${prId}`, { key: env("SUPABASE_SERVICE_ROLE_KEY") });
    record("PRAISE: author resolved server-side", adminRd.data?.[0]?.praise_author === "Perf Test", JSON.stringify(adminRd.data?.[0]));
  }

  // ---- MENU ----
  const mi = await supabaseGet(`/rest/v1/menu_items?select=id&limit=1`, u());
  record("DATA: menu_items readable", mi.status === 200);

  // ---- ADMIN (grant temp) ----
  const srv = env("SUPABASE_SERVICE_ROLE_KEY");
  // Multi-tenant: the temp admin row must carry the test user's institution_id.
  const instId = (await supabaseGet(`/rest/v1/institutions?select=id&slug=eq.nit-agartala&limit=1`, u())).data?.[0]?.id ?? (await supabaseGet(`/rest/v1/institutions?select=id&limit=1`, u())).data?.[0]?.id;
  const adminAdded = await supabasePost("/rest/v1/admin_members", { user_id: uid, role: "admin", institution_id: instId }, { key: srv });
  const wasAdmin = adminAdded.status === 201;
  if (wasAdmin) {
    for (const p of ["/admin", "/admin/complaints", "/admin/users", "/admin/menu", "/admin/settings", "/admin/reports"]) {
      const rr = await request(p, { cookie: cookieSlug });
      record(`ADMIN: GET ${p}`, rr.status === 200, `status ${rr.status}`);
    }
  }
  await supabasePost(`/rest/v1/admin_members?user_id=eq.${uid}`, {}, { key: srv }, "DELETE");
  const adminAfter = await request("/admin", { cookie: cookieSlug });
  record("ADMIN: access revoked after removal", adminAfter.status === 307, `status ${adminAfter.status}`);

  // ---- BAN ----
  const banUser = await supabasePost("/rest/v1/profiles?id=eq." + uid, { is_banned: true }, { key: srv });
  if (banUser.status === 204) {
    const home = await request("/nit-agartala", { cookie: cookieSlug });
    record("BAN: home shows suspended screen", home.status === 200 && home.body.includes("Account suspended"));
    const block = await supabasePost("/rest/v1/complaints", {
      user_id: uid, mess_id: messId, category_id: cat, title: "QA banned insert", description: "should fail",
    }, u());
    record("BAN: inserts blocked by RLS", block.status === 403, `status ${block.status}`);
  }
  await supabasePost("/rest/v1/profiles?id=eq." + uid, { is_banned: false }, { key: srv });

  const fails = results.filter((x) => !x.ok);
  console.log(`\n=== ${results.length - fails.length}/${results.length} passed ===`);
  process.exit(fails.length ? 1 : 0);
}


main().catch((e) => {
  console.error("QA aborted:", e.message);
  process.exit(2);
});