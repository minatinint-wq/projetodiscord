import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

async function persistedWithRetention(days) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "sesh-retention-"));
  const dataFile = path.join(temp, "database.json");
  const port = 36900 + Math.floor(Math.random() * 500);
  const oldDate = "2020-01-02T03:04:05.000Z";
  await writeFile(dataFile, JSON.stringify({
    messages: [
      { id: "old-message", channelId: "channel", authorId: "author", content: "conteúdo antigo", attachment: "data:image/png;base64,AAAA", createdAt: oldDate },
      { id: "pinned-message", channelId: "channel", authorId: "author", content: "conteúdo fixado", pinnedAt: oldDate, createdAt: oldDate },
    ],
    directMessages: [
      { id: "old-dm", authorId: "author", recipientId: "friend", content: "dm preservada", createdAt: oldDate },
    ],
  }));
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), DATABASE_URL: "", DATA_FILE: dataFile,
      DATA_ENCRYPTION_KEY: "", SEED_DEMO_USER: "false", MESSAGE_RETENTION_DAYS: days,
      MASTER_ADMIN_EMAIL: "", MASTER_ADMIN_PASSWORD: "", MASTER_ADMIN_EMAILS: "", CREATOR_EMAIL: "", CREATOR_EMAILS: "" },
    stdio: "ignore",
  });
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) break; } catch {}
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    const ended = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await ended;
    return JSON.parse(await readFile(dataFile, "utf8"));
  } finally {
    if (!child.killed) child.kill();
    await rm(temp, { recursive: true, force: true });
  }
}

test("retenção fica infinita sem variável configurada", async () => {
  const database = await persistedWithRetention("");
  assert.equal(database.messages.find((message) => message.id === "old-message").content, "conteúdo antigo");
});

test("retenção configurada troca conteúdo antigo por hash e preserva fixadas e DMs", async () => {
  const database = await persistedWithRetention("30");
  const expired = database.messages.find((message) => message.id === "old-message");
  assert.equal(expired.content, undefined);
  assert.equal(expired.attachment, undefined);
  assert.match(expired.messageHash, /^[a-f0-9]{64}$/);
  assert(expired.expiredAt);
  assert.equal(database.messages.find((message) => message.id === "pinned-message").content, "conteúdo fixado");
  assert.equal(database.directMessages.find((message) => message.id === "old-dm").content, "dm preservada");
});
