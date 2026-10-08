import fs from "node:fs";
import { randomBytes } from "node:crypto";
import pg from "pg";
import nextEnv from "@next/env";
import { databaseConnection, databaseClient } from "./auth-db.mjs";
import { SUPABASE_DATABASE_CA } from "../lib/tasks/database-ca.js";

nextEnv.loadEnvConfig(process.cwd());
const version = "20261008123000";
const repairLogin = process.argv.includes("--repair-login");
const migration = fs.readFileSync(`supabase/migrations/${version}_tasks.sql`, "utf8");
const client = databaseClient();
let login;
try {
  await client.connect();
  const applied = await client.query("select version from supabase_migrations.schema_migrations where version = $1", [version]);
  if (!applied.rowCount) {
    // Commit schema and migration history together; this migration owns its BEGIN/COMMIT.
    const sql = migration.replace(/commit;\s*$/i, "");
    await client.query(sql);
    await client.query("insert into supabase_migrations.schema_migrations (version,name,statements) values ($1,$2,$3)", [version, "tasks", [migration]]);
    await client.query("commit");
    console.log("Task migration applied and recorded.");
  } else console.log("Task migration already applied.");

  const role = await client.query("select 1 from pg_roles where rolname = 'task_api'");
  if (!role.rowCount) {
    const password = randomBytes(32).toString("hex");
    // Password is generated hex, never user-supplied SQL and never printed.
    await client.query(`create role task_api login inherit nosuperuser nocreatedb nocreaterole nobypassrls password '${password}'`);
    await client.query("grant task_backend to task_api");
    const url = new URL(databaseConnection());
    const username = decodeURIComponent(url.username);
    url.username = username.includes(".") ? `task_api${username.slice(username.indexOf("."))}` : "task_api";
    url.password = password;
    login = url.toString();
  } else {
    login = process.env.TASK_DATABASE_URL;
    if (!login) throw new Error("Task login exists. Configure its TASK_DATABASE_URL without rotating existing credentials.");
    if (repairLogin) {
      // Restore this app's existing random credential only when explicitly invoked.
      // Never rotate shared project credentials or grant extra database privileges.
      const saved = new URL(login);
      const setup = new URL(databaseConnection());
      const setupUser = decodeURIComponent(setup.username);
      const expectedUser = setupUser.includes(".") ? `task_api${setupUser.slice(setupUser.indexOf("."))}` : "task_api";
      const password = decodeURIComponent(saved.password);
      if (decodeURIComponent(saved.username) !== expectedUser || saved.hostname !== setup.hostname ||
          saved.port !== setup.port || saved.pathname !== setup.pathname || !/^[a-f0-9]{64}$/.test(password)) {
        throw new Error("Repair requires this project's existing dedicated Task connection and generated credential.");
      }
      const { rows: [security] } = await client.query("select rolcanlogin,rolbypassrls,rolsuper,pg_has_role('task_api','task_backend','member') as backend_member from pg_roles where rolname='task_api'");
      if (!security?.rolcanlogin || security.rolbypassrls || security.rolsuper || !security.backend_member) {
        throw new Error("Repair requires the restricted Task login, without elevated privileges.");
      }
      // Generated hex only: no user-supplied SQL and no credentials in output.
      await client.query(`alter role task_api password '${password}'`);
      console.log("Dedicated Task login credential restored to the existing local configuration.");
    }
  }

  // Confirm encrypted, certificate-verified access using the dedicated non-bypass role.
  const scoped = new pg.Client({ connectionString: login, ssl: { rejectUnauthorized: true, ca: process.env.TASK_DATABASE_CA?.replace(/\\n/g, "\n") || SUPABASE_DATABASE_CA }, connectionTimeoutMillis: 10000 });
  try {
    await scoped.connect();
    const { rows: [security] } = await scoped.query("select current_user, (select rolbypassrls from pg_roles where rolname=current_user) as bypass, (select rolsuper from pg_roles where rolname=current_user) as superuser");
    if (security.current_user !== "task_api" || security.bypass || security.superuser) throw new Error("Task login must enforce RLS.");
    console.log("Dedicated Task login connected with certificate verification and RLS enforced.");
  } finally { await scoped.end(); }

  const path = ".env.local";
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/).filter((line) => !/^TASK_DATABASE_URL=/.test(line));
  lines.push(`TASK_DATABASE_URL=${login}`);
  fs.writeFileSync(path, lines.join("\n").trim() + "\n");
  console.log("Server-only Task connection saved in the ignored local environment file.");
} catch (error) {
  await client.query("rollback").catch(() => {});
  // A newly provisioned login must not be lost if its connection check fails.
  if (login && !process.env.TASK_DATABASE_URL) {
    const path = ".env.local";
    const lines = fs.readFileSync(path, "utf8").split(/\r?\n/).filter((line) => !/^TASK_DATABASE_URL=/.test(line));
    lines.push(`TASK_DATABASE_URL=${login}`);
    fs.writeFileSync(path, lines.join("\n").trim() + "\n");
  }
  console.error("Task setup could not finish:", error.code || error.name);
  process.exitCode = 1;
} finally { await client.end(); }
