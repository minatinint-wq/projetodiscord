import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { REMOTE_AVATAR_DECORATIONS } from "../avatar-decorations.js";

const sourceDir = path.resolve(process.argv[2] || "");
const connectionString = String(process.env.DATABASE_URL || "").trim();
if (!connectionString) throw new Error("Defina DATABASE_URL antes de importar as molduras.");

const expected = new Set(REMOTE_AVATAR_DECORATIONS.map(([id]) => id));
const ssl = process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" };
const client = new pg.Client({ connectionString, ssl });
await client.connect();
try {
  await client.query("CREATE TABLE IF NOT EXISTS avatar_decorations (id text primary key, content_type text not null default 'image/png', bytes bytea not null, updated_at timestamptz not null default now())");
  const names = await fs.readdir(sourceDir);
  const files = names.filter(name => name.endsWith(".png") && expected.has(path.basename(name, ".png")));
  if (files.length !== expected.size) throw new Error(`Pacote incompleto: esperadas ${expected.size} molduras, encontradas ${files.length}.`);
  await client.query("BEGIN");
  for (const name of files) {
    const id = path.basename(name, ".png");
    const bytes = await fs.readFile(path.join(sourceDir, name));
    await client.query("INSERT INTO avatar_decorations (id, content_type, bytes, updated_at) VALUES ($1, 'image/png', $2, now()) ON CONFLICT (id) DO UPDATE SET bytes = EXCLUDED.bytes, content_type = EXCLUDED.content_type, updated_at = now()", [id, bytes]);
  }
  await client.query("COMMIT");
  console.log(`Importadas ${files.length} molduras.`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}
