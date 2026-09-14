import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { NAMEPLATES, NAMEPLATE_IDS, nameplateSrc } from "../nameplates.js";
import { REMOTE_AVATAR_DECORATIONS } from "../avatar-decorations.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const port = 34700 + Math.floor(Math.random() * 300);
const baseUrl = `http://127.0.0.1:${port}`;
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
  const payload = await response.json();
  const setCookie = response.headers.get("set-cookie") || "";
  const jar = (setCookie.match(/sesh_session=[^;]*/) || [])[0];
  if (jar) cookie = jar;
  return { status: response.status, payload };
}

test("catálogos íntegros: 236 nameplates com arquivo + 634 molduras", () => {
  assert.equal(NAMEPLATES.length, 236);
  assert.equal(REMOTE_AVATAR_DECORATIONS.length, 634);
  assert.equal(new Set(NAMEPLATES.map(([id]) => id)).size, 236);
  assert.equal(new Set(REMOTE_AVATAR_DECORATIONS.map(([id]) => id)).size, 634);
  for (const [, , file] of NAMEPLATES.slice(0, 20))
    assert.ok(existsSync(path.join(projectRoot, "public", "nameplates", file)), file);
  for (const [, , file] of NAMEPLATES.slice(-5))
    assert.ok(existsSync(path.join(projectRoot, "public", "nameplates", file)), file);
  assert.ok(NAMEPLATE_IDS.has("brazil"));
  assert.ok(nameplateSrc("brazil").endsWith(encodeURI("brazil.webm")));
});

before(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "sesh-nameplate-"));
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
      MASTER_ADMIN_EMAIL: "plate-admin@sesh.local",
      MASTER_ADMIN_PASSWORD: "Plate-Admin-97531",
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

test("nameplate exige Nitro, aceita com Nitro e rejeita desconhecida", async () => {
  const reg = await req("/api/auth/register", "POST", {
    username: "plateuser",
    displayName: "Plate User",
    email: "plateuser@sesh.local",
    password: "Prato-Fundo-24680",
  });
  assert.equal(reg.status, 201);
  const userCookie = cookie;

  const denied = await req("/api/auth/me", "PATCH", { profilePlate: "brazil" });
  assert.equal(denied.status, 403);

  const adminLogin = await req("/api/auth/login", "POST", {
    username: "plate-admin@sesh.local",
    password: "Plate-Admin-97531",
  });
  assert.equal(adminLogin.status, 200);
  const grant = await req(`/api/users/${reg.payload.user.id}/badges`, "PATCH", {
    badges: ["nitro_classic"],
  });
  assert.equal(grant.status, 200);

  cookie = userCookie;
  const ok = await req("/api/auth/me", "PATCH", { profilePlate: "brazil" });
  assert.equal(ok.status, 200);
  assert.equal(ok.payload.user.profilePlate, "brazil");

  const unknown = await req("/api/auth/me", "PATCH", { profilePlate: "nao-existe" });
  assert.equal(unknown.status, 200);
  assert.equal(unknown.payload.user.profilePlate, "default");
});
