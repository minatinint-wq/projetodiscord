import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 37000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
let tempDir;
let serverProcess;

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("O servidor de teste não iniciou.");
}

function sessionCookie(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  const match = setCookie.match(/sesh_session=[^;]*/);
  return match ? match[0] : "";
}

async function request(pathname, method = "GET", input, auth) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Cookie: auth } : {}),
    },
    ...(input === undefined ? {} : { body: JSON.stringify(input) }),
  });
  const payload = await response.json();
  return { status: response.status, payload, cookie: sessionCookie(response) || auth || "" };
}

before(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "sesh-message-actions-"));
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
});

after(async () => {
  serverProcess?.kill();
  if (tempDir?.startsWith(os.tmpdir())) await rm(tempDir, { recursive: true, force: true });
});

test("ações de mensagem respeitam autoria, permissões e persistência", async () => {
  const ownerLogin = await request("/api/auth/login", "POST", { username: "demo", password: "demo123" });
  assert.equal(ownerLogin.status, 200);
  const ownerToken = ownerLogin.cookie;
  const created = await request("/api/servers", "POST", { name: "Ações de mensagem" }, ownerToken);
  assert.equal(created.status, 201);
  const server = created.payload.server;
  const channel = server.channels.find((item) => item.type === "text");

  const member = await request("/api/auth/register", "POST", {
    username: "mensageiro",
    displayName: "Mensageiro",
    email: "mensageiro@sesh.local",
    password: "Rio-Bravo-24680",
  });
  assert.equal(member.status, 201);
  const memberToken = member.cookie;
  assert.equal((await request(`/api/servers/${server.inviteCode}/join`, "POST", {}, memberToken)).status, 200);

  const sent = await request(`/api/channels/${channel.id}/messages`, "POST", { content: "Mensagem original" }, ownerToken);
  assert.equal(sent.status, 201);
  const message = sent.payload.message;

  const reaction = await request(`/api/channels/${channel.id}/messages/${message.id}/reactions`, "POST", { emoji: "👍" }, memberToken);
  assert.equal(reaction.status, 200);
  assert.equal(reaction.payload.message.reactions[0].count, 1);
  assert.equal(reaction.payload.message.reactions[0].userIds.includes(member.payload.user.id), true);

  const reply = await request(`/api/channels/${channel.id}/messages`, "POST", { content: "Resposta", replyToId: message.id }, memberToken);
  assert.equal(reply.status, 201);
  assert.equal(reply.payload.message.replyTo.id, message.id);
  assert.equal(reply.payload.message.replyTo.author.id, ownerLogin.payload.user.id);

  const forwarded = await request(`/api/channels/${channel.id}/messages`, "POST", { forwardedMessageId: message.id }, memberToken);
  assert.equal(forwarded.status, 201);
  assert.equal(forwarded.payload.message.content, "Mensagem original");
  assert.equal(forwarded.payload.message.forwardedFrom.messageId, message.id);

  const forbiddenPin = await request(`/api/channels/${channel.id}/messages/${message.id}`, "PATCH", { pinned: true }, memberToken);
  assert.equal(forbiddenPin.status, 403);
  const pinned = await request(`/api/channels/${channel.id}/messages/${message.id}`, "PATCH", { pinned: true }, ownerToken);
  assert.equal(pinned.status, 200);
  assert.ok(pinned.payload.message.pinnedAt);

  const edited = await request(`/api/channels/${channel.id}/messages/${message.id}`, "PATCH", { content: "Mensagem editada" }, ownerToken);
  assert.equal(edited.status, 200);
  assert.equal(edited.payload.message.content, "Mensagem editada");
  assert.ok(edited.payload.message.editedAt);

  const reported = await request(`/api/channels/${channel.id}/messages/${message.id}/report`, "POST", { reason: "Teste de moderação" }, memberToken);
  assert.equal(reported.status, 201);
  assert.ok(reported.payload.reportId);

  const forbiddenDelete = await request(`/api/channels/${channel.id}/messages/${message.id}`, "DELETE", undefined, memberToken);
  assert.equal(forbiddenDelete.status, 403);
  assert.equal((await request(`/api/channels/${channel.id}/messages/${message.id}`, "DELETE", undefined, ownerToken)).status, 200);

  const listed = await request(`/api/channels/${channel.id}/messages`, "GET", undefined, ownerToken);
  assert.equal(listed.status, 200);
  assert.equal(listed.payload.messages.some((item) => item.id === message.id), false);
});
