import "server-only";
import { Pool } from "pg";
import { TaskError } from "./validation";
import { SUPABASE_DATABASE_CA } from "./database-ca";

let pool;
function taskPool() {
  if (!process.env.TASK_DATABASE_URL) throw new TaskError("پەیوەندی ئەرکەکان هێشتا ئامادە نییە.", 503);
  pool ??= new Pool({
    connectionString: process.env.TASK_DATABASE_URL,
    ssl: { rejectUnauthorized: true, ca: process.env.TASK_DATABASE_CA?.replace(/\\n/g, "\n") || SUPABASE_DATABASE_CA },
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
  return pool;
}

// The login role cannot bypass RLS. Auth supplies this ID; APIs never accept it.
export async function taskTransaction(userId, operation) {
  const client = await taskPool().connect();
  try {
    await client.query("begin");
    await client.query("set local statement_timeout = '10s'");
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally { client.release(); }
}
