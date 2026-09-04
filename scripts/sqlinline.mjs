#!/usr/bin/env node
// Run SQL against the Supabase project via Management API.
// Usage: node scripts/sqlinline.mjs "SELECT ..."
const sql = process.argv.slice(2).join(" ");
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF ?? "gmkzcxvgbhhvznbkxlae";
if (!sql) { console.error("usage: node scripts/sqlinline.mjs <sql>"); process.exit(1); }
if (!token) { console.error("Set SUPABASE_ACCESS_TOKEN"); process.exit(1); }
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
if (!res.ok) { console.error(res.status, text.slice(0, 3000)); process.exit(1); }
try { console.log(JSON.stringify(JSON.parse(text), null, 1)); } catch { console.log(text); }
