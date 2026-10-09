import { query } from "./lib/db.js"; query("SELECT * FROM private.ai_keys").then(res => console.log(res.rows)).catch(console.error).finally(() => process.exit(0));
