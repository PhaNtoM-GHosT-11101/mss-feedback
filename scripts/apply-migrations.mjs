// One-time migration runner: applies supabase/migrations/*.sql in order.
// Usage: MIGRATE_DB_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres" node scripts/apply-migrations.mjs
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const dir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(dir, "..", "supabase", "migrations");
const url = process.env.MIGRATE_DB_URL;

if (!url) {
  console.error("Set MIGRATE_DB_URL first.");
  process.exit(1);
}

const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

await client.connect();
for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  console.log(`Applying ${file}...`);
  await client.query(sql);
  console.log(`  ok (${sql.split(";").length} statements)`);
}
await client.end();
console.log("All migrations applied.");
