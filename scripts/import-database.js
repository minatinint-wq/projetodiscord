import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const COLLECTIONS = [
  "users",
  "servers",
  "channels",
  "messages",
  "memberships",
  "friendships",
];

function decrypt(raw) {
  if (!raw.startsWith("SESH1:")) return raw;
  const encodedKey = String(process.env.DATA_ENCRYPTION_KEY || "").trim();
  const key = encodedKey ? Buffer.from(encodedKey, "base64") : null;
  if (!key || key.length !== 32)
    throw new Error(
      "Defina DATA_ENCRYPTION_KEY com a chave de 32 bytes do arquivo.",
    );
  const parts = raw.split(":");
  if (parts.length !== 4)
    throw new Error("O banco criptografado tem formato inválido.");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(parts[1], "base64"),
  );
  decipher.setAuthTag(Buffer.from(parts[2], "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(parts[3], "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function validateDatabase(input) {
  if (!input || typeof input !== "object")
    throw new Error("O arquivo não contém um banco Sesh válido.");
  for (const key of COLLECTIONS)
    if (!Array.isArray(input[key]))
      throw new Error("Coleção ausente ou inválida: " + key);

  const unique = (items, field, label) => {
    const values = items.map((item) => item?.[field]).filter(Boolean);
    if (new Set(values).size !== values.length)
      throw new Error("Existem valores duplicados em " + label + ".");
  };
  unique(input.users, "id", "users.id");
  unique(input.servers, "id", "servers.id");
  unique(input.channels, "id", "channels.id");
  unique(input.messages, "id", "messages.id");

  const userIds = new Set(input.users.map((item) => item.id));
  const serverIds = new Set(input.servers.map((item) => item.id));
  const channelIds = new Set(input.channels.map((item) => item.id));
  if (
    input.memberships.some(
      (item) => !userIds.has(item.userId) || !serverIds.has(item.serverId),
    )
  )
    throw new Error("Há uma associação de membro sem usuário ou servidor.");
  if (input.channels.some((item) => !serverIds.has(item.serverId)))
    throw new Error("Há um canal sem servidor.");
  if (
    input.messages.some(
      (item) => !channelIds.has(item.channelId) || !userIds.has(item.authorId),
    )
  )
    throw new Error("Há uma mensagem sem canal ou autor.");
}

const sourcePath = path.resolve(process.argv[2] || "data/database.json");
const replaceExisting = process.argv.includes("--replace");
const connectionString = String(process.env.DATABASE_URL || "").trim();
if (!connectionString)
  throw new Error("Defina DATABASE_URL com a URL externa do Render Postgres.");

const raw = await fs.readFile(sourcePath, "utf8");
const database = JSON.parse(decrypt(raw));
validateDatabase(database);

const ssl =
  process.env.DATABASE_SSL === "false"
    ? false
    : {
        rejectUnauthorized:
          process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
      };
const client = new pg.Client({ connectionString, ssl });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(
    "CREATE TABLE IF NOT EXISTS app_state (key text primary key, value jsonb not null)",
  );
  const current = await client.query(
    "SELECT value FROM app_state WHERE key = 'users'",
  );
  const existingUsers = Array.isArray(current.rows[0]?.value)
    ? current.rows[0].value
    : [];
  if (existingUsers.length && !replaceExisting)
    throw new Error(
      "O destino já possui usuários. Faça backup e repita com --replace.",
    );

  for (const key of COLLECTIONS)
    await client.query(
      "INSERT INTO app_state (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, JSON.stringify(database[key])],
    );
  await client.query("COMMIT");
  console.log("Importação concluída com segurança:");
  for (const key of COLLECTIONS)
    console.log("- " + key + ": " + database[key].length);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end().catch(() => {});
}
