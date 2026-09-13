import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { classifyImagePrompt, parseImageCommand } from "../image-generation.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPort = 36000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${appPort}`;
const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
let tempDir;
let appProcess;
let providerServer;
let providerUrl;
let providerCalls = 0;

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
}

async function waitForApp() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("O servidor de teste da IA não iniciou.");
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  return { response, payload: await response.json() };
}

before(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "sesh-ai-test-"));
  providerServer = http.createServer((_req, res) => {
    providerCalls += 1;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ image: tinyPng }));
  });
  await listen(providerServer);
  providerUrl = `http://127.0.0.1:${providerServer.address().port}/generate`;
  appProcess = spawn(process.execPath, ["server.js"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(appPort),
      DATA_FILE: path.join(tempDir, "database.json"),
      DATABASE_URL: "",
      SEED_DEMO_USER: "true",
      DATA_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      NORMAL_IMAGE_API_URL: providerUrl,
      NSFW_IMAGE_API_URL: providerUrl,
      NSFW_HF_SPACE_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForApp();
});

after(async () => {
  appProcess?.kill();
  await new Promise((resolve) => providerServer?.close(resolve));
  if (tempDir?.startsWith(os.tmpdir())) await rm(tempDir, { recursive: true, force: true });
});

test("parser exige o formato com aspas e classificador protege menores", () => {
  assert.deepEqual(parseImageCommand('/image "paisagem violeta"'), {
    command: "image", prompt: "paisagem violeta", nsfw: false,
  });
  assert.equal(parseImageCommand('/imagem "cachorro sorrindo"').command, "image");
  assert.equal(parseImageCommand("/imagensfw sem aspas").invalid, true);
  assert.equal(classifyImagePrompt("adult nude editorial").adult, true);
  assert.equal(classifyImagePrompt("underage nude").prohibited, true);
  assert.equal(classifyImagePrompt("explicit sex").prohibited, true);
});

test("geração fica no servidor, exige administrador e não persiste para outros membros", async () => {
  const ownerLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "demo", password: "demo123" }),
  });
  const ownerAuth = { Authorization: `Bearer ${ownerLogin.payload.token}` };
  const created = await request("/api/servers", {
    method: "POST", headers: ownerAuth, body: JSON.stringify({ name: "IA privada" }),
  });
  const server = created.payload.server;
  const channelId = server.channels[0].id;

  const memberRegistration = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: "membroia", displayName: "Membro IA", email: "membroia@sesh.local", password: "teste123",
    }),
  });
  const memberAuth = { Authorization: `Bearer ${memberRegistration.payload.token}` };
  await request(`/api/servers/${server.inviteCode}/join`, { method: "POST", headers: memberAuth });

  const ownerResult = await request(`/api/channels/${channelId}/messages`, {
    method: "POST", headers: ownerAuth,
    body: JSON.stringify({ content: '/imagensfw "adult boudoir in elegant lingerie"' }),
  });
  assert.equal(ownerResult.response.status, 201);
  assert.equal(ownerResult.payload.ephemeral, true);
  assert.equal(ownerResult.payload.message.ai.nsfw, true);
  assert.equal(ownerResult.payload.message.ai.ephemeral, true);
  assert.equal(ownerResult.payload.message.author.displayName, "IA SESH");

  const forbidden = await request(`/api/channels/${channelId}/messages`, {
    method: "POST", headers: memberAuth,
    body: JSON.stringify({ content: '/image "paisagem comum"' }),
  });
  assert.equal(forbidden.response.status, 403);
  assert.match(forbidden.payload.error, /administradores/i);

  const adminRole = {
    id: "admin", name: "Administrador", color: "#7656e8", style: "solid",
    permissions: { sendMessages: true, manageServer: true },
  };
  const promoted = await request(`/api/servers/${server.id}`, {
    method: "PATCH", headers: ownerAuth,
    body: JSON.stringify({ roles: [...server.roles, adminRole], memberRoles: { [memberRegistration.payload.user.id]: "admin" } }),
  });
  assert.equal(promoted.response.status, 200);

  const adminResult = await request(`/api/channels/${channelId}/messages`, {
    method: "POST", headers: memberAuth,
    body: JSON.stringify({ content: '/image "paisagem comum"' }),
  });
  assert.equal(adminResult.response.status, 201);
  assert.equal(adminResult.payload.message.ai.nsfw, false);

  const visibleMessages = await request(`/api/channels/${channelId}/messages`, { headers: memberAuth });
  assert.equal(visibleMessages.response.status, 200);
  assert.equal(visibleMessages.payload.messages.some((message) => message.id === ownerResult.payload.message.id), false);
  assert.equal(visibleMessages.payload.messages.some((message) => message.id === adminResult.payload.message.id), false);
  assert.equal(providerCalls, 2);
});
