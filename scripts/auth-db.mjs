import fs from "node:fs";
import pg from "pg";

export function databaseConnection() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  // Reuse the existing local connector; its credentials never enter app code.
  const config = JSON.parse(fs.readFileSync('.agents/mcp_config.json', 'utf8'));
  const server = (config.mcpServers ?? config)['supabase-db'];
  const connection = server?.args?.find((arg) => arg.startsWith('postgresql://'));
  if (!connection) throw new Error('Set SUPABASE_DB_URL to the existing Supabase database.');
  return connection;
}

export function databaseClient() {
  return new pg.Client({ connectionString: databaseConnection(), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
}
