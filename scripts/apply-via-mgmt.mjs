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

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  process.stdout.write(`Applying ${file}... `);
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.log("FAILED");
    console.error(text.slice(0, 2000));
    process.exit(1);
  }
  console.log("ok");
}
console.log("All migrations applied.");
