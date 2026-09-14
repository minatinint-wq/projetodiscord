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
const port = 34500 + Math.floor(Math.random() * 500);
const baseUrl = `http://127.0.0.1:${port}`;
let tempDir;
let serverProcess;

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

async function raw(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const text = await response.text();
  let payload = {};
  try {
    payload = JSON.parse(text);
  } catch {
    // Resposta em texto (security.txt, robots.txt, 404).
  }
  return { response, payload, text };
}

before(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "sesh-hardening-"));
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
  if (tempDir?.startsWith(os.tmpdir())) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("health não expõe versão/stack e valida o método", async () => {
  const health = await raw("/api/health");
  assert.equal(health.response.status, 200);
  assert.equal(health.payload.ok, true);
  assert.equal(health.payload.version, undefined);
  assert.equal(health.payload.storage, undefined);

  for (const method of ["PUT", "DELETE", "PATCH", "POST"]) {
    const rejected = await raw("/api/health", { method });
    assert.equal(rejected.response.status, 405);
    assert.ok(rejected.response.headers.get("allow")?.includes("GET"));
  }
});

test("login limita tentativas e responde com Retry-After", async () => {
  const identifier = `forca-bruta-${Date.now()}`;
  let blocked = 0;
  for (let i = 0; i < 7; i += 1) {
    const attempt = await raw("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifier, password: "Senha-Errada-001" }),
    });
    if (attempt.response.status === 429) {
      blocked += 1;
      assert.ok(attempt.response.headers.get("retry-after"));
    } else {
      assert.equal(attempt.response.status, 401);
    }
  }
  assert.ok(blocked >= 1);
});

test("cadastro exige senha forte e não devolve token no corpo", async () => {
  const weak = await raw("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "fraco",
      displayName: "Fraco",
      email: "fraco@sesh.local",
      password: "curta",
    }),
  });
  assert.equal(weak.response.status, 400);
  assert.match(weak.payload.error, /10 caracteres/);

  const common = await raw("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "comum",
      displayName: "Comum",
      email: "comum@sesh.local",
      password: "1234567890",
    }),
  });
  assert.equal(common.response.status, 400);
  assert.match(common.payload.error, /muito comum/);

  const ok = await raw("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "forte",
      displayName: "Forte",
      email: "forte@sesh.local",
      password: "Vela-Azul-2026",
    }),
  });
  assert.equal(ok.response.status, 201);
  assert.equal(ok.payload.token, undefined);
  assert.match(ok.response.headers.get("set-cookie") || "", /sesh_session=/);

  const login = await raw("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "forte", password: "Vela-Azul-2026" }),
  });
  assert.equal(login.response.status, 200);
  assert.equal(login.payload.token, undefined);
  assert.match(login.response.headers.get("set-cookie") || "", /sesh_session=/);
});

test("higiene: security.txt, robots.txt e dotfiles com 404", async () => {
  const security = await raw("/.well-known/security.txt");
  assert.equal(security.response.status, 200);
  assert.match(security.text, /Contact:/);

  const robots = await raw("/robots.txt");
  assert.equal(robots.response.status, 200);
  assert.match(robots.text, /Disallow: \/api\//);

  for (const probe of ["/.env", "/.git/HEAD", "/.ds_store"]) {
    const blocked = await raw(probe);
    assert.equal(blocked.response.status, 404);
  }
});
