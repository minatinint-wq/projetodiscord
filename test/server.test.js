import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const port = 34000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
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

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  return { response, payload };
}

async function connectVoice(token) {
  const ticketResult = await request("/api/auth/ws-ticket", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(ticketResult.response.status, 201);
  const ticket = ticketResult.payload.ticket;
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(
      `${baseUrl.replace("http", "ws")}/ws?ticket=${encodeURIComponent(ticket)}`,
    );
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

function waitForSocketEvent(socket, predicate, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("message", onMessage);
      reject(new Error("Evento WebSocket não recebido a tempo."));
    }, timeout);
    const onMessage = (raw) => {
      const event = JSON.parse(raw.toString());
      if (!predicate(event)) return;
      clearTimeout(timer);
      socket.off("message", onMessage);
      resolve(event);
    };
    socket.on("message", onMessage);
  });
}

before(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "sesh-test-"));
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

test("saúde, autenticação e isolamento básico funcionam", async () => {
  const health = await request("/api/health");
  assert.equal(health.response.status, 200);
  assert.equal(health.payload.ok, true);

  const anonymous = await request("/api/auth/me");
  assert.equal(anonymous.response.status, 401);

  const malformed = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);

  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "demo", password: "demo123" }),
  });
  assert.equal(login.response.status, 200);
  assert.equal(login.payload.user.username, "demo");
  assert.ok(login.payload.token);

  const auth = { Authorization: `Bearer ${login.payload.token}` };
  const me = await request("/api/auth/me", { headers: auth });
  assert.equal(me.response.status, 200);
  assert.equal(me.payload.user.email, "demo@sesh.local");

  const created = await request("/api/servers", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ name: "Sala de teste" }),
  });
  assert.equal(created.response.status, 201);

  const customizedServer = await request(
    `/api/servers/${created.payload.server.id}`,
    {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({
        tag: "PLAY",
        banner: tinyPng,
        icon: tinyPng,
        accentColor: "#d6404b",
      }),
    },
  );
  assert.equal(customizedServer.response.status, 200);
  assert.equal(customizedServer.payload.server.tag, "PLAY");
  assert.equal(customizedServer.payload.server.accentColor, "#d6404b");
  assert.match(customizedServer.payload.server.icon, /^data:image\/png/);

  const customizedProfile = await request("/api/auth/me", {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({
      avatarFrame: "ruby",
      avatar: tinyPng,
      profileEffect: "glow",
      bio: "Perfil seguro",
      favoriteGame: "Jogo de teste",
      activityText: "Em uma partida",
      wishlist: "Próxima aventura",
    }),
  });
  assert.equal(customizedProfile.response.status, 200);
  assert.equal(customizedProfile.payload.user.avatarFrame, "ruby");
  assert.equal(customizedProfile.payload.user.favoriteGame, "Jogo de teste");
  assert.match(customizedProfile.payload.user.avatar, /^data:image\/png/);
  assert.equal(customizedProfile.payload.user.profileEffect, "glow");
  const badgePromotion = await request("/api/auth/me", {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({ badges: ["rara", "criador"] }),
  });
  assert.equal(badgePromotion.response.status, 403);
  assert.deepEqual(customizedProfile.payload.user.badges, []);
  assert.equal(customizedProfile.payload.user.badges.includes("criador"), false);


  const secondUser = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: "visitante",
      displayName: "Visitante",
      email: "visitante@sesh.local",
      password: "teste123",
    }),
  });
  assert.equal(secondUser.response.status, 201);

  const secondAuth = {
    Authorization: `Bearer ${secondUser.payload.token}`,
  };
  const hiddenProfile = await request(`/api/users/${login.payload.user.id}`, {
    headers: secondAuth,
  });
  assert.equal(hiddenProfile.response.status, 404);
  const hiddenMessages = await request(
    `/api/channels/${created.payload.server.channels[0].id}/messages`,
    { headers: secondAuth },
  );
  assert.equal(hiddenMessages.response.status, 404);
  const massAssignment = await request("/api/auth/me", {
    method: "PATCH",
    headers: secondAuth,
    body: JSON.stringify({
      id: login.payload.user.id,
      isCreator: true,
      ownerId: login.payload.user.id,
    }),
  });
  assert.equal(massAssignment.response.status, 200);
  assert.equal(massAssignment.payload.user.id, secondUser.payload.user.id);
  const forbidden = await request(`/api/servers/${created.payload.server.id}`, {
    method: "POST",
    headers: secondAuth,
    body: JSON.stringify({ name: "sem-permissao", type: "text" }),
  });
  assert.equal(forbidden.response.status, 403);

  const joined = await request(
    `/api/servers/${created.payload.server.inviteCode}/join`,
    { method: "POST", headers: secondAuth },
  );
  assert.equal(joined.response.status, 200);
  const memberForbidden = await request(`/api/servers/${created.payload.server.id}`, {
    method: "POST",
    headers: secondAuth,
    body: JSON.stringify({ name: "ainda-sem-permissao", type: "text" }),
  });
  assert.equal(memberForbidden.response.status, 403);
  assert.notEqual(created.payload.server.inviteCode, created.payload.server.id);

  const voiceChannel = created.payload.server.channels.find(
    (channel) => channel.type === "voice",
  );
  assert.ok(voiceChannel);

  const ownerSocket = await connectVoice(login.payload.token);
  const visitorSocket = await connectVoice(secondUser.payload.token);
  try {
    const ownerJoined = waitForSocketEvent(
      ownerSocket,
      (event) =>
        event.type === "voice.participants" &&
        event.participants.length === 1,
    );
    ownerSocket.send(
      JSON.stringify({ type: "voice.join", channelId: voiceChannel.id }),
    );
    await ownerJoined;

    const roomReady = waitForSocketEvent(
      ownerSocket,
      (event) =>
        event.type === "voice.participants" &&
        event.participants.length === 2,
    );
    visitorSocket.send(
      JSON.stringify({ type: "voice.join", channelId: voiceChannel.id }),
    );
    const orderedRoom = await roomReady;
    assert.deepEqual(
      orderedRoom.participants.map((participant) => participant.id),
      [login.payload.user.id, secondUser.payload.user.id],
    );

    const mediaUpdated = waitForSocketEvent(
      ownerSocket,
      (event) =>
        event.type === "voice.participants" &&
        event.participants.some(
          (participant) =>
            participant.id === secondUser.payload.user.id &&
            participant.camera &&
            participant.screen,
        ),
    );
    visitorSocket.send(
      JSON.stringify({
        type: "voice.media",
        channelId: voiceChannel.id,
        camera: true,
        screen: true,
      }),
    );
    const mediaEvent = await mediaUpdated;
    const visitorState = mediaEvent.participants.find(
      (participant) => participant.id === secondUser.payload.user.id,
    );
    assert.equal(visitorState.camera, true);
    assert.equal(visitorState.screen, true);

    const offerRelayed = waitForSocketEvent(
      ownerSocket,
      (event) =>
        event.type === "voice.offer" &&
        event.fromUserId === secondUser.payload.user.id,
    );
    visitorSocket.send(
      JSON.stringify({
        type: "voice.offer",
        targetUserId: login.payload.user.id,
        offer: { type: "offer", sdp: "smoke-test" },
      }),
    );
    const offer = await offerRelayed;
    assert.equal(offer.offer.sdp, "smoke-test");
  } finally {
    ownerSocket.close();
    visitorSocket.close();
  }

  const encryptedDatabase = await readFile(
    path.join(tempDir, "database.json"),
    "utf8",
  );
  assert.match(encryptedDatabase, /^SESH1:/);
  assert.equal(encryptedDatabase.includes("demo@sesh.local"), false);
});
