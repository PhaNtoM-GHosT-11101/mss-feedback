// Applies supabase/migrations/*.sql via the Supabase Management API (HTTPS only).
// Usage: SUPABASE_PAT=sbp_... node scripts/apply-via-mgmt.mjs
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(dir, "..", "supabase", "migrations");
const pat = process.env.SUPABASE_PAT;
const ref = process.env.SUPABASE_PROJECT_REF ?? "gmkzcxvgbhhvznbkxlae";

if (!pat) {
  console.error("Set SUPABASE_PAT first.");
  process.exit(1);
}

const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text.slice(0, 2000));
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

await query(
  `create table if not exists public.schema_migrations (file text primary key, applied_at timestamptz not null default now());`,
);
const applied = (await query(`select file from public.schema_migrations`)).map((r) => r.file);

for (const file of files) {
  if (applied.includes(file)) {
    console.log(`Skipping ${file} (already applied)`);
    continue;
  }
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  process.stdout.write(`Applying ${file}... `);
  try {
    await query(sql);
    await query(`insert into public.schema_migrations (file) values ('${file}')`);
    console.log("ok");
  } catch (e) {
    console.log("FAILED");
    console.error(String(e.message ?? e).slice(0, 2000));
    process.exit(1);
  }
}
console.log("All migrations applied.");
