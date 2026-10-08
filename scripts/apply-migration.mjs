// Applies one SQL migration file to the existing Supabase database.
// Usage: node scripts/apply-migration.mjs supabase/migrations/<file>.sql
import fs from "node:fs";
import nextEnv from "@next/env";
import { databaseClient } from "./auth-db.mjs";

nextEnv.loadEnvConfig(process.cwd());
const file = process.argv[2];
if (!file) throw new Error("Pass the migration file path.");

const client = databaseClient();
try {
  await client.connect();
  await client.query(fs.readFileSync(file, "utf8"));
  console.log(`Applied ${file}`);
} finally {
  await client.end();
}
