import fs from "node:fs";
import { databaseClient } from "./auth-db.mjs";
const migrations = [
  ["20261008135245", "profile_task_evaluation"],
  ["20261008141019", "task_unreadable_evaluation"],
];
const db = databaseClient();
try {
  await db.connect();
  for (const [version, name] of migrations) {
    const migration = fs.readFileSync(`supabase/migrations/${version}_${name}.sql`, "utf8");
    const existing = await db.query("select 1 from supabase_migrations.schema_migrations where version=$1", [version]);
    if (existing.rowCount) { console.log(`Task migration ${name} already applied.`); continue; }
    await db.query(migration.replace(/commit;\s*$/i, ""));
    await db.query("insert into supabase_migrations.schema_migrations(version,name,statements) values($1,$2,$3)", [version, name, [migration]]);
    await db.query("commit");
    console.log(`Task migration ${name} applied; existing history preserved.`);
  }
} catch (error) {
  await db.query("rollback").catch(() => {});
  console.error("Task migration failed:", error.code || error.name);
  process.exitCode = 1;
} finally { await db.end(); }
