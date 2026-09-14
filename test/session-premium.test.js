import assert from "node:assert/strict"
import { after, test } from "node:test"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const port = 36200 + Math.floor(Math.random() * 300)
const baseUrl = "http://127.0.0.1:" + port
const temp = await mkdtemp(path.join(os.tmpdir(), "sesh-session-"))
const dataFile = path.join(temp, "data.json")
let processHandle

async function start() {
  processHandle = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), DATABASE_URL: "", DATA_FILE: dataFile,
      SEED_DEMO_USER: "true", MASTER_ADMIN_EMAIL: "session-admin@sesh.local",
      MASTER_ADMIN_PASSWORD: "session-admin-password", MASTER_ADMIN_EMAILS: "", CREATOR_EMAIL: "", CREATOR_EMAILS: "" },
    stdio: "ignore",
  })
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(baseUrl + "/api/health")).ok) return } catch {}
    await new Promise((resolve) => setTimeout(resolve, 40))
  }
  throw new Error("Servidor de teste não iniciou")
}
async function stop() {
  if (!processHandle?.killed) {
    const ended = new Promise((resolve) => processHandle.once("exit", resolve))
    processHandle.kill()
    await ended
  }
}
async function request(route, method = "GET", data, auth) {
  const response = await fetch(baseUrl + route, {
    method,
    headers: { "Content-Type": "application/json", ...(auth ? { Cookie: auth } : {}) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  })
  const setCookie = response.headers.get("set-cookie") || ""
  const jar = (setCookie.match(/sesh_session=[^;]*/) || [])[0] || auth || ""
  return { status: response.status, cookie: jar, token: jar, ...await response.json() }
}

after(async () => { await stop(); await rm(temp, { recursive: true, force: true }) })

test("sessão persiste no restart, mute fantasma é reparado e Nitro protege cosméticos", async () => {
  await start()
  const owner = await request("/api/auth/login", "POST", { username: "demo", password: "demo123" })
  const guest = await request("/api/auth/register", "POST", { username: "restartguest", email: "restart@sesh.local", password: "Reinicio-468013" })
  assert.equal((await request("/api/auth/me", "PATCH", { avatarFrame: "fire" }, guest.token)).status, 403)
  const admin = await request("/api/auth/login", "POST", { username: "session-admin@sesh.local", password: "session-admin-password" })
  assert.equal((await request("/api/users/" + guest.user.id + "/badges", "PATCH", { badges: ["nitro_classic"] }, admin.token)).status, 200)
  assert.equal((await request("/api/auth/me", "PATCH", { avatarFrame: "fire", profileOverlay: "infernal-dragon", bannerPreset: "steel-wolf" }, guest.token)).status, 200)

  const community = (await request("/api/servers", "POST", { name: "Sessão persistente" }, owner.token)).server
  await request("/api/servers/" + community.inviteCode + "/join", "POST", {}, guest.token)
  await stop()

  const database = JSON.parse(await readFile(dataFile, "utf8"))
  const membership = database.memberships.find((item) => item.serverId === community.id && item.userId === guest.user.id)
  membership.textMuted = true
  delete membership.textMutedAt
  delete membership.textMutedBy
  await writeFile(dataFile, JSON.stringify(database, null, 2))

  await start()
  assert.equal((await request("/api/auth/me", "GET", undefined, guest.token)).status, 200)
  assert.equal((await request("/api/channels/" + community.channels[0].id + "/messages", "POST", { content: "sessão recuperada" }, guest.token)).status, 201)
})
