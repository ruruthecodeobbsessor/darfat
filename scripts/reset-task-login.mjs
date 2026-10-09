import fs from "node:fs";
import { randomBytes } from "node:crypto";
import pg from "pg";
import nextEnv from "@next/env";
import { databaseConnection, databaseClient } from "./auth-db.mjs";
import { SUPABASE_DATABASE_CA } from "../lib/tasks/database-ca.js";

// Gives the existing restricted task_api login a new random password and saves
// TASK_DATABASE_URL to .env.local. Use when the original local credential is lost.
nextEnv.loadEnvConfig(process.cwd());
const client = databaseClient();
await client.connect();
try {
  const { rows: [role] } = await client.query("select rolcanlogin, rolbypassrls, rolsuper, pg_has_role('task_api','task_backend','member') as backend from pg_roles where rolname='task_api'");
  if (!role || !role.rolcanlogin || role.rolbypassrls || role.rolsuper || !role.backend) throw new Error("task_api is not the expected restricted login");

  // Generated hex only; never printed.
  const password = randomBytes(32).toString("hex");
  await client.query(`alter role task_api password '${password}'`);
  const url = new URL(databaseConnection());
  const user = decodeURIComponent(url.username);
  url.username = user.includes(".") ? `task_api${user.slice(user.indexOf("."))}` : "task_api";
  url.password = password;
  const login = url.toString();

  // Save before verifying so a new password is never lost.
  const lines = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((line) => !/^TASK_DATABASE_URL=/.test(line));
  lines.push(`TASK_DATABASE_URL=${login}`);
  fs.writeFileSync(".env.local", lines.join("\n").trim() + "\n");
  console.log("New TASK_DATABASE_URL saved to .env.local; verifying login...");

  // The Supabase pooler can keep the old password cached briefly; retry for about a minute.
  let security;
  for (let attempt = 1; ; attempt++) {
    const scoped = new pg.Client({ connectionString: login, ssl: { rejectUnauthorized: true, ca: SUPABASE_DATABASE_CA }, connectionTimeoutMillis: 10000 });
    try {
      await scoped.connect();
      ({ rows: [security] } = await scoped.query("select current_user, (select rolbypassrls from pg_roles where rolname=current_user) as bypass"));
      break;
    } catch (error) {
      if (error.code !== "28P01" || attempt >= 12) throw error;
      console.log(`Login not accepted yet (attempt ${attempt}/12), waiting 5s...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } finally { await scoped.end().catch(() => {}); }
  }
  if (security.current_user !== "task_api" || security.bypass) throw new Error("Task login must enforce RLS.");
  console.log("task_api login verified (RLS enforced).");
} catch (error) {
  console.error("failed:", error.code || error.message);
  process.exitCode = 1;
} finally { await client.end(); }
