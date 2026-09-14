import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const port = 34600 + Math.floor(Math.random() * 400);
const baseUrl = `http://127.0.0.1:${port}`;
const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const bigPng = "data:image/png;base64," + Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  Buffer.alloc(200_000, 7),
]).toString("base64");
let tempDir;
let serverProcess;
let cookie = "";

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // O processo ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("O servidor de teste não iniciou.");
}

async function req(pathname, method = "GET", body) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  const setCookie = response.headers.get("set-cookie") || "";
  const jar = (setCookie.match(/sesh_session=[^;]*/) || [])[0];
  if (jar) cookie = jar;
  return { status: response.status, bytes: text.length, payload: JSON.parse(text) };
}

let channelId;
let imageMessageId;

before(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "sesh-chatperf-"));
  serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      DATA_FILE: path.join(tempDir, "database.json"),
      DATABASE_URL: "",
      SEED_DEMO_USER: "true",
      DATA_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForServer();
  await req("/api/auth/login", "POST", { username: "demo", password: "demo123" });
  const created = await req("/api/servers", "POST", { name: "Perf" });
  channelId = created.payload.server.channels.find((c) => c.type === "text").id;
  for (let i = 0; i < 5; i += 1)
    await req(`/api/channels/${channelId}/messages`, "POST", { content: `texto ${i}` });
  const img = await req(`/api/channels/${channelId}/messages`, "POST", {
    content: "foto grande",
    attachment: bigPng,
  });
  assert.equal(img.status, 201);
  imageMessageId = img.payload.message.id;
  // POST continua devolvendo o anexo completo (render imediato de quem enviou).
  assert.equal(img.payload.message.attachment, bigPng);
});

after(async () => {
  serverProcess?.kill();
  if (tempDir?.startsWith(os.tmpdir())) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("listagem padrão continua completa (compatibilidade)", async () => {
  const full = await req(`/api/channels/${channelId}/messages`);
  assert.equal(full.status, 200);
  const found = full.payload.messages.find((m) => m.id === imageMessageId);
  assert.equal(found.attachment, bigPng);
});

test("modo refs troca base64 por descritor e reduz o payload", async () => {
  const full = await req(`/api/channels/${channelId}/messages`);
  const light = await req(`/api/channels/${channelId}/messages?attachments=refs`);
  assert.equal(light.status, 200);
  assert.equal(light.payload.messages.length, full.payload.messages.length);
  assert.ok(light.bytes < full.bytes / 10);
  const found = light.payload.messages.find((m) => m.id === imageMessageId);
  assert.deepEqual(found.attachment, { ref: true, kind: "image" });
  assert.ok(!JSON.stringify(light.payload).includes("base64"));
  const textOnly = light.payload.messages.find((m) => !m.attachment);
  assert.ok(textOnly);
});

test("busca individual devolve a mensagem completa", async () => {
  const single = await req(`/api/channels/${channelId}/messages/${imageMessageId}`);
  assert.equal(single.status, 200);
  assert.equal(single.payload.message.attachment, bigPng);
  assert.equal((await req(`/api/channels/${channelId}/messages/inexistente`)).status, 404);
});
