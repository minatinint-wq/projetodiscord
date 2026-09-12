import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { GAME_CATALOG, GAME_IDS } from "./game-catalog.js";
import { PROFILE_EFFECTS, AVATAR_FRAMES, PROFILE_OVERLAYS } from "./cosmetics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_VERSION = JSON.parse(await fs.readFile(new URL("./package.json", import.meta.url), "utf8")).version;
const dataDir = path.join(__dirname, "data");
const dataFile = path.resolve(
  process.env.DATA_FILE || path.join(dataDir, "database.json"),
);
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || (isProduction ? 8080 : 3001));
const host = process.env.HOST || (isProduction ? "0.0.0.0" : "127.0.0.1");
const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();
const CORS_ORIGIN = String(process.env.CORS_ORIGIN || "").trim();
const DATA_ENCRYPTION_KEY = String(
  process.env.DATA_ENCRYPTION_KEY || "",
).trim();
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();
const RESEND_FROM_EMAIL = String(process.env.RESEND_FROM_EMAIL || "").trim();
const SESH_PUBLIC_URL = String(process.env.SESH_PUBLIC_URL || "").trim().replace(/\/$/, "");
const COLLECTIONS = [
  "users",
  "servers",
  "channels",
  "messages",
  "memberships",
  "adminCatalog",
  "subscriptions",
  "friendships",
  "emailVerifications",
  "directMessages",
];
const sessions = new Map();
const wsTickets = new Map();
const loginAttempts = new Map();
const sockets = new Map();
const voiceRooms = new Map();
const MASTER_ADMIN_EMAIL = String(process.env.MASTER_ADMIN_EMAIL || "")
  .trim()
  .toLowerCase();
const MASTER_ADMIN_EMAILS = new Set(
  [process.env.MASTER_ADMIN_EMAIL, process.env.MASTER_ADMIN_EMAILS]
    .flatMap((value) => String(value || "").split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);
const MASTER_ADMIN_PASSWORD = String(process.env.MASTER_ADMIN_PASSWORD || "");
const CREATOR_EMAILS = new Set(
  String(process.env.CREATOR_EMAILS || process.env.CREATOR_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);
const ALLOWED_BADGES = [
  "criador",
  "fundador",
  "rara",
  "apoiador_inicial",
  "nitro_classic",
  "mes_1",
  "mes_3",
  "mes_6",
  "mes_9",
  "mes_12",
  "verificado",
  "moderador",
  "desenvolvedor",
  "cacador_bugs",
  "artista",
  "streamer",
  "apoiador",
];
const LEGACY_BADGES = {
  booster: "apoiador",
  bug: "cacador_bugs",
  dev: "desenvolvedor",
  star: "fundador",
};
const SUBSCRIPTION_PLANS = {
  classic: {
    id: "classic",
    name: "Nitro Classic",
    priceCents: 1500,
  },
  booster: {
    id: "booster",
    name: "Booster",
    priceCents: 3000,
  },
};

const ROLE_PERMISSIONS = [
  "viewChannels", "manageChannels", "manageRoles", "manageExpressions",
  "manageWebhooks", "manageServer", "manageMembers", "createInvite", "changeNickname",
  "manageNicknames", "kickMembers", "banMembers", "timeoutMembers",
  "sendMessages", "sendMessagesThreads", "createPublicThreads",
  "createPrivateThreads", "embedLinks", "attachFiles", "addReactions",
  "useExternalEmojis", "useExternalStickers", "mentionEveryone",
  "manageMessages", "pinMessages", "bypassSlowmode", "connectVoice",
  "speakVoice", "useCamera", "shareScreen", "prioritySpeaker",
  "muteMembers", "deafenMembers", "moveMembers", "useVoiceActivity",
  "useSoundboard", "useExternalSounds",
];
const DEFAULT_MEMBER_PERMISSIONS = {
  viewChannels: true,
  createInvite: true,
  changeNickname: true,
  sendMessages: true,
  sendMessagesThreads: true,
  createPublicThreads: true,
  embedLinks: true,
  attachFiles: true,
  addReactions: true,
  useExternalEmojis: true,
  useExternalStickers: true,
  connectVoice: true,
  speakVoice: true,
  useCamera: true,
  shareScreen: true,
  useVoiceActivity: true,
};
const ROLE_STYLES = ["solid", "glow", "pulse", "blink"];
function defaultRoles() {
  return [
    {
      id: "owner",
      name: "Dono",
      color: "#ef5964",
      style: "glow",
      position: 0,
      permissions: Object.fromEntries(
        ROLE_PERMISSIONS.map((permission) => [permission, true]),
      ),
    },
    {
      id: "member",
      name: "Membro",
      color: "#8f96a3",
      style: "solid",
      position: 999,
      permissions: { ...DEFAULT_MEMBER_PERMISSIONS },
    },
  ];
}
function normalizedRoles(roles) {
  const defaults = defaultRoles();
  if (!Array.isArray(roles)) return defaults;
  const member = roles.find((role) => role?.id === "member");
  if (member?.permissions) defaults[1].permissions = Object.fromEntries(
    ROLE_PERMISSIONS.map((key) => [key, member.permissions[key] === undefined
      ? Boolean(DEFAULT_MEMBER_PERMISSIONS[key]) : Boolean(member.permissions[key])]),
  );
  const seen = new Set();
  const custom = roles
    .filter((role) => {
      if (!role || typeof role !== "object" || ["owner", "member"].includes(role.id) || seen.has(role.id)) return false;
      seen.add(role.id);
      return true;
    })
    .slice(0, 23)
    .map((role, index) => ({
      id: /^[a-zA-Z0-9_-]{1,50}$/.test(String(role.id || ""))
        ? String(role.id)
        : "role_" + id(),
      name: String(role.name || "Novo cargo").trim().slice(0, 40),
      color: /^#[0-9a-fA-F]{6}$/.test(String(role.color || ""))
        ? String(role.color)
        : "#c93642",
      style: ROLE_STYLES.includes(role.style) ? role.style : "solid",
      hoist: Boolean(role.hoist),
      icon: safeImageDataUrl(role.icon, 350_000) ? role.icon : null,
      position: index + 1,
      permissions: Object.fromEntries(
        ROLE_PERMISSIONS.map((permission) => [
          permission,
          Boolean(role.permissions?.[permission]),
        ]),
      ),
    }));
  return [
    defaults[0],
    ...custom,
    { ...defaults[1], position: custom.length + 1 },
  ];
}
let database;
let pgClient = null;
let saveQueue = Promise.resolve();
const encryptionKey = DATA_ENCRYPTION_KEY
  ? Buffer.from(DATA_ENCRYPTION_KEY, "base64")
  : null;
if (encryptionKey && encryptionKey.length !== 32)
  throw new Error("DATA_ENCRYPTION_KEY precisa conter 32 bytes em base64.");

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const hashPassword = (
  password,
  salt = crypto.randomBytes(16).toString("hex"),
) => ({ salt, hash: crypto.scryptSync(password, salt, 64).toString("hex") });
const verifyPassword = (password, record) => {
  if (!record?.salt || !record?.hash) return false;
  try {
    const actual = Buffer.from(hashPassword(password, record.salt).hash, "hex");
    const expected = Buffer.from(record.hash, "hex");
    return (
      actual.length === expected.length &&
      crypto.timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
};
const initials = (name) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const blankDatabase = () =>
  Object.fromEntries(COLLECTIONS.map((key) => [key, []]));
const normalizeDatabase = (input) => {
  const normalized = Object.fromEntries(
    COLLECTIONS.map((key) => [
      key,
      Array.isArray(input?.[key]) ? input[key] : [],
    ]),
  );
  normalized.users = normalized.users.map((user) => ({
    ...user,
    badges: [
      ...new Set(
        (Array.isArray(user.badges) ? user.badges : [])
          .map((badge) => LEGACY_BADGES[badge] || badge)
          .filter((badge) => ALLOWED_BADGES.includes(badge)),
      ),
    ],
    avatarFrame: user.avatarFrame || "none",
    favoriteGame: user.favoriteGame || "",
    activityText: user.activityText || "",
    wishlist: user.wishlist || "",
    emailVerifiedAt: user.emailVerifiedAt === undefined ? now() : user.emailVerifiedAt,
  }));
  normalized.servers = normalized.servers.map((server) => {
    const candidateTag = String(server.tag || server.name || "SESH")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 4)
      .toUpperCase();
    return {
      ...server,
      inviteCode: server.inviteCode || crypto.randomBytes(12).toString("base64url"),
      roles: normalizedRoles(server.roles),
      tag: candidateTag.length >= 2 ? candidateTag : "SESH",
      banner: server.banner || null,
      accentColor: /^#[0-9a-fA-F]{6}$/.test(server.accentColor || "")
        ? server.accentColor
        : "#c93642",
    };
  });
  normalized.memberships = normalized.memberships.map((membership) => ({
    ...membership,
    roleId:
      membership.roleId ||
      (membership.role === "owner" ? "owner" : "member"),
    textMuted: Boolean(membership.textMuted),
    voiceMuted: Boolean(membership.voiceMuted),
  }));
  return normalized;
};

function encodeDatabase(value) {
  const plain = JSON.stringify(value);
  if (!encryptionKey) return `${JSON.stringify(value, null, 2)}\n`;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  return [
    "SESH1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

function decodeDatabase(raw) {
  if (!raw.startsWith("SESH1:")) return JSON.parse(raw);
  if (!encryptionKey)
    throw new Error(
      "O banco local está criptografado, mas a chave não existe.",
    );
  const [, ivValue, tagValue, encryptedValue] = raw.split(":");
  if (!ivValue || !tagValue || !encryptedValue)
    throw new Error("Formato do banco criptografado inválido.");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(ivValue, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plain);
}

function starterServer(user) {
  const serverId = id();
  const generalId = id();
  const callId = id();
  return {
    server: {
      id: serverId,
      inviteCode: crypto.randomBytes(12).toString("base64url"),
      roles: defaultRoles(),
      name: `Comunidade de ${user.displayName}`,
      icon: initials(user.displayName),
      tag: "SESH",
      banner: null,
      accentColor: "#c93642",
      ownerId: user.id,
      createdAt: now(),
    },
    membership: { userId: user.id, serverId, role: "owner", roleId: "owner", joinedAt: now() },
    channels: [
      {
        id: generalId,
        serverId,
        name: "geral",
        type: "text",
        topic: "Converse, compartilhe e crie junto",
        position: 0,
        createdAt: now(),
      },
      {
        id: callId,
        serverId,
        name: "Call da comunidade",
        type: "voice",
        topic: "Converse por áudio",
        position: 1,
        createdAt: now(),
      },
    ],
    message: {
      id: id(),
      channelId: generalId,
      authorId: user.id,
      content: `Bem-vindo ao Sesh, ${user.displayName}! Este é o seu primeiro canal.`,
      createdAt: now(),
      editedAt: null,
    },
  };
}
async function loadDatabase() {
  if (DATABASE_URL) {
    const { default: pg } = await import("pg");
    const ssl =
      process.env.DATABASE_SSL === "false"
        ? false
        : {
            rejectUnauthorized:
              process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
          };
    pgClient = new pg.Client({ connectionString: DATABASE_URL, ssl });
    await pgClient.connect();
    await pgClient.query(
      "CREATE TABLE IF NOT EXISTS app_state (key text primary key, value jsonb not null)",
    );
    const { rows } = await pgClient.query("SELECT key, value FROM app_state");
    const loaded = {};
    for (const row of rows) loaded[row.key] = row.value;
    database = normalizeDatabase(loaded);
  } else {
    let loaded = null;
    try {
      loaded = decodeDatabase(await fs.readFile(dataFile, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    database = normalizeDatabase(loaded || blankDatabase());
  }

  const shouldSeedDemo =
    process.env.SEED_DEMO_USER === "true" ||
    (!DATABASE_URL &&
      !isProduction &&
      process.env.SEED_DEMO_USER !== "false");
  if (
    shouldSeedDemo &&
    !database.users.some((user) => user.username === "demo")
  ) {
    const password = hashPassword("demo123");
    const userId = id();
    const user = {
      id: userId,
      username: "demo",
      displayName: "Usuário Demo",
      email: "demo@sesh.local",
      emailVerifiedAt: now(),
      password,
      avatarColor: "purple",
      createdAt: now(),
    };
    const starter = starterServer(user);
    database.users.push(user);
    database.servers.push(starter.server);
    database.memberships.push(starter.membership);
    database.channels.push(...starter.channels);
    database.messages.push(starter.message);
  }
  if (MASTER_ADMIN_EMAIL && MASTER_ADMIN_PASSWORD.length >= 8) {
    let admin = database.users.find(
      (user) => (user.email || "").toLowerCase() === MASTER_ADMIN_EMAIL,
    );
    if (!admin) {
      const baseUsername = "sesh_admin";
      const username = database.users.some((user) => user.username === baseUsername)
        ? baseUsername + "_" + crypto.randomBytes(3).toString("hex")
        : baseUsername;
      admin = {
        id: id(),
        username,
        displayName: "Admin Master",
        email: MASTER_ADMIN_EMAIL,
        emailVerifiedAt: now(),
        password: hashPassword(MASTER_ADMIN_PASSWORD),
        avatarColor: "red",
        badges: ["criador"],
        createdAt: now(),
      };
      database.users.push(admin);
    }
  }
  for (const user of database.users) {
    const badges = Array.isArray(user.badges) ? user.badges : [];
    user.badges = isCreator(user)
      ? [...new Set([...badges, "criador"])]
      : badges.filter((badge) => badge !== "criador");
  }
  await saveDatabase();
  console.log(
    `Sesh: ${database.users.length} usuário(s) carregados do armazenamento ${DATABASE_URL ? "PostgreSQL" : "local"}.`,
  );
}
async function persistDatabase() {
  const snapshot = structuredClone(database);
  if (pgClient) {
    await pgClient.query("BEGIN");
    try {
    for (const key of COLLECTIONS) {
      await pgClient.query(
        "INSERT INTO app_state (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [key, JSON.stringify(snapshot[key] || [])],
      );
    }
    await pgClient.query("COMMIT");
    } catch (error) { await pgClient.query("ROLLBACK"); throw error; }
    return;
  }
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(`${dataFile}.tmp`, encodeDatabase(snapshot), "utf8");
  await fs.rename(`${dataFile}.tmp`, dataFile);
}
function saveDatabase() {
  saveQueue = saveQueue.catch(() => {}).then(persistDatabase);
  return saveQueue;
}
function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy":
      "camera=(self), microphone=(self), display-capture=(self), geolocation=()",
    "Content-Security-Policy":
      "default-src 'self'; img-src 'self' data: https:; media-src 'self' blob:; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    ...(isProduction
      ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" }
      : {}),
  };
}
function json(res, status, payload) {
  const headers = {
    ...securityHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Cache-Control": "no-store",
  };
  if (CORS_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = CORS_ORIGIN;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}
function userTag(user) {
  // #0001 é reservada exclusivamente para a conta administradora principal.
  if (isPrimaryMasterAdmin(user)) return "0001";
  if (/^\d{4}$/.test(String(user?.tag || "")) && String(user.tag) !== "0001") return String(user.tag);
  const source = String(user?.id || user?.username || "sesh");
  let hash = 0;
  for (const character of source)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return String(1000 + (hash % 9000));
}
function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    tag: userTag(user),
    displayName: user.displayName,
    createdAt: user.createdAt || null,
    avatarColor: user.avatarColor,
    avatar: user.avatar || null,
    banner: user.banner || null,
    bannerPreset: user.bannerPreset || "aurora",
    bannerPositionX: user.bannerPositionX ?? 50,
    bannerPositionY: user.bannerPositionY ?? 50,
    effectIntensity: user.effectIntensity || "balanced",
    effectSpeed: user.effectSpeed || "normal",
    profileOverlay: user.profileOverlay || "none",
    profilePrimaryColor: user.profilePrimaryColor || null,
    profileAccentColor: user.profileAccentColor || null,
    bio: user.bio || "",
    badges: badgesForUser(user),
    status: user.status || "online",
    nameStyle: user.nameStyle || "default",
    nameColor: user.nameColor || "#f1f3f5",
    nameEffect: user.nameEffect || "solid",
    profileTheme: user.profileTheme || "default",
    profilePlate: user.profilePlate || "default",
    profileEffect: user.profileEffect || "none",
    avatarFrame: user.avatarFrame || "none",
    favoriteGame: user.favoriteGame || "",
    gameInterests: Array.isArray(user.gameInterests) ? user.gameInterests.filter((gameId) => GAME_IDS.has(gameId)).slice(0, 12) : [],
    activityText: user.activityText || "",
    wishlist: user.wishlist || "",
  };
}
function isCreator(user) {
  const email = (user?.email || "").toLowerCase();
  return Boolean(email && (isMasterAdmin(user) || CREATOR_EMAILS.has(email)));
}
function isPrimaryMasterAdmin(user) {
  return Boolean(
    MASTER_ADMIN_EMAIL &&
      (user?.email || "").toLowerCase() === MASTER_ADMIN_EMAIL,
  );
}
function isMasterAdmin(user) {
  return MASTER_ADMIN_EMAILS.has((user?.email || "").toLowerCase());
}
function sanitizeBadges(target, badges) {
  const selected = Array.isArray(badges)
    ? [...new Set(badges.filter((badge) => ALLOWED_BADGES.includes(badge)))]
    : [];
  // Only master admins reach this mutation; badges do not confer admin permissions.
  return selected;
}
function activeSubscriptionFor(userId) {
  return database.subscriptions
    .filter((subscription) => subscription.userId === userId && subscription.status === "active")
    .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))[0];
}
function subscriptionBadges(user) {
  const subscription = activeSubscriptionFor(user.id);
  if (!subscription) return [];
  const badges = [];
  if (subscription.earlySupporter) badges.push("apoiador_inicial");
  if (subscription.planId === "classic") badges.push("nitro_classic");
  if (subscription.planId === "booster") {
    badges.push("apoiador");
    const months = Math.max(
      1,
      Math.floor((Date.now() - new Date(subscription.startedAt).getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1,
    );
    badges.push(
      months >= 12 ? "mes_12" :
      months >= 9 ? "mes_9" :
      months >= 6 ? "mes_6" :
      months >= 3 ? "mes_3" : "mes_1",
    );
  }
  return badges;
}
function badgesForUser(user) {
  const manual = Array.isArray(user.badges) ? user.badges : [];
  return [...new Set([
    ...manual.filter((badge) => ALLOWED_BADGES.includes(badge)),
    ...subscriptionBadges(user),
  ])];
}
async function issueEmailVerification(user) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !SESH_PUBLIC_URL) return { sent: false, configured: false };
  const token = crypto.randomBytes(32).toString("base64url");
  database.emailVerifications = database.emailVerifications.filter((item) => item.userId !== user.id);
  database.emailVerifications.push({
    id: id(), userId: user.id,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    createdAt: now(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
  await saveDatabase();
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !SESH_PUBLIC_URL) return { sent: false, configured: false };
  const verificationUrl = `${SESH_PUBLIC_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(8_000),
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: [user.email], subject: "Confirme seu e-mail no Sesh", html: `<p>Olá!</p><p>Confirme seu e-mail se desejar. Esta etapa é opcional e não bloqueia login ou chamadas:</p><p><a href="${verificationUrl}">Confirmar e-mail</a></p><p>Este link expira em 24 horas.</p>` }),
  });
  if (!response.ok) throw new Error("Não foi possível enviar o e-mail de confirmação.");
  return { sent: true, configured: true };
}

function sessionUser(user) {
  return {
    ...publicUser(user),
    email: user.email || "",
    emailVerified: Boolean(user.emailVerifiedAt),
    isCreator: isCreator(user),
    isMasterAdmin: isMasterAdmin(user),
    preferences: user.preferences || {},
  };
}
function broadcastAll(event) {
  for (const [, socket] of sockets)
    if (socket.readyState === 1) socket.send(JSON.stringify(event));
}
function notifyUser(userId, event) {
  const socket = sockets.get(userId);
  if (socket?.readyState === 1) socket.send(JSON.stringify(event));
}
function voiceStateOf(userId) {
  for (const [channelId, room] of voiceRooms)
    if (room.has(userId)) {
      const channel = database.channels.find((item) => item.id === channelId);
      if (channel) return { channelId: channel.id, channelName: channel.name };
    }
  return null;
}
function presenceOf(user) {
  if (voiceStateOf(user.id)) return "voice";
  if (!sockets.has(user.id) || user.status === "invisible") return "offline";
  return user.status === "idle"
    ? "idle"
    : user.status === "dnd"
      ? "dnd"
      : "online";
}
function friendView(friendship, viewerId) {
  const otherId =
    friendship.requesterId === viewerId
      ? friendship.addresseeId
      : friendship.requesterId;
  const other = database.users.find((item) => item.id === otherId);
  if (!other) return null;
  const voice = voiceStateOf(other.id);
  return {
    friendshipId: friendship.id,
    direction: friendship.requesterId === viewerId ? "outgoing" : "incoming",
    presence: presenceOf(other),
    voice,
    ...publicUser(other),
  };
}
function sessionToken(req) {
  const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (bearer) return bearer;
  const cookie = String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("sesh_session="));
  return cookie ? decodeURIComponent(cookie.slice("sesh_session=".length)) : "";
}
function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    "sesh_session=" + encodeURIComponent(token) +
      "; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800" +
      (isProduction ? "; Secure" : ""),
  );
}
function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    "sesh_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" +
      (isProduction ? "; Secure" : ""),
  );
}
function canViewUser(viewer, target) {
  if (!viewer || !target) return false;
  if (viewer.id === target.id) return true;
  const friends = database.friendships.some(
    (item) =>
      item.status === "accepted" &&
      [item.requesterId, item.addresseeId].includes(viewer.id) &&
      [item.requesterId, item.addresseeId].includes(target.id),
  );
  if (friends) return true;
  const viewerServers = new Set(
    database.memberships
      .filter((item) => item.userId === viewer.id)
      .map((item) => item.serverId),
  );
  return database.memberships.some(
    (item) => item.userId === target.id && viewerServers.has(item.serverId),
  );
}
function loginLimitKey(req, identifier) {
  return (req.socket.remoteAddress || "unknown") + ":" + identifier;
}
function loginBlocked(req, identifier) {
  const key = loginLimitKey(req, identifier);
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= Date.now()) {
    loginAttempts.delete(key);
    return false;
  }
  return current.count >= 8;
}
function recordLoginFailure(req, identifier) {
  const key = loginLimitKey(req, identifier);
  const current = loginAttempts.get(key);
  loginAttempts.set(key, {
    count: current?.resetAt > Date.now() ? current.count + 1 : 1,
    resetAt: current?.resetAt > Date.now()
      ? current.resetAt
      : Date.now() + 15 * 60_000,
  });
}
function getUser(req) {
  const token = sessionToken(req);
  const userId = sessions.get(token);
  return database.users.find((user) => user.id === userId);
}
function safeImageDataUrl(value, maxLength = 4_250_000) {
  if (typeof value !== "string" || value.length > maxLength) return false;
  const match = value.match(
    /^data:image\/(png|jpeg|gif|webp);base64,([a-z0-9+/=]+)$/i,
  );
  if (!match) return false;
  let bytes;
  try {
    bytes = Buffer.from(match[2], "base64");
  } catch {
    return false;
  }
  if (!bytes.length) return false;
  const mime = match[1].toLowerCase();
  if (mime === "png")
    return bytes.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  if (mime === "jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "gif")
    return ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString());
  return (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP"
  );
}
function requestOriginAllowed(req) {
  const origin = String(req.headers.origin || "");
  if (!origin) return true;
  if (CORS_ORIGIN) return origin === CORS_ORIGIN;
  const protocol =
    String(req.headers["x-forwarded-proto"] || "").split(",")[0] ||
    (req.socket.encrypted ? "https" : "http");
  return origin === protocol + "://" + req.headers.host;
}
function safeAttachment(value) {
  if (typeof value === "string") return safeImageDataUrl(value);
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  if (typeof value.name !== "string" || !value.name.trim() || value.name.length > 180 || /[\\/\x00-\x1f]/.test(value.name)) return false;
  if (typeof value.data !== "string" || value.data.length > 4_250_000 ||
      !/^data:application\/octet-stream;base64,[A-Za-z0-9+/]+={0,2}$/.test(value.data)) return false;
  const bytes = Buffer.from(value.data.split(",")[1], "base64");
  return Number.isInteger(value.size) && bytes.length === value.size && bytes.length > 0 && bytes.length <= 3 * 1024 * 1024;
}
async function body(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 9_000_000) {
      // O limite inclui a expansão de base64 de avatar e banner.
      const error = new Error("Corpo da requisição muito grande.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
    return parsed;
  } catch {
    const error = new Error("JSON inválido.");
    error.status = 400;
    throw error;
  }
}
function serverForUser(user, serverId) {
  return database.servers.find(
    (server) =>
      server.id === serverId &&
      database.memberships.some(
        (m) => m.serverId === serverId && m.userId === user.id,
      ),
  );
}
function channelForUser(user, channelId) {
  const channel = database.channels.find((item) => item.id === channelId);
  return channel && serverForUser(user, channel.serverId) ? channel : null;
}
function membershipFor(user, serverId) {
  return database.memberships.find(
    (membership) =>
      membership.serverId === serverId && membership.userId === user?.id,
  );
}
function roleForMembership(server, membership) {
  const roles = normalizedRoles(server.roles);
  return (
    roles.find((role) => role.id === membership?.roleId) ||
    roles.find((role) =>
      role.id === (membership?.role === "owner" ? "owner" : "member"),
    )
  );
}
function hasServerPermission(user, server, permission) {
  if (!user || !server) return false;
  if (server.ownerId === user.id) return true;
  const membership = membershipFor(user, server.id);
  if (!membership) return false;
  return Boolean(
    roleForMembership(server, membership)?.permissions?.[permission],
  );
}
function memberView(server, membership) {
  const person = database.users.find((item) => item.id === membership.userId);
  if (!person) return null;
  const serverRole = roleForMembership(server, membership);
  return {
    ...publicUser(person),
    roleId: serverRole?.id || "member",
    serverRole,
    joinedAt: membership.joinedAt,
    textMuted: Boolean(membership.textMuted),
    voiceMuted: Boolean(membership.voiceMuted),
  };
}
function decorateMessage(message) {
  const user = database.users.find((item) => item.id === message.authorId);
  return { ...message, author: publicUser(user) };
}
function decorateServer(server, user) {
  const memberCount = database.memberships.filter(
    (item) => item.serverId === server.id,
  ).length;
  const channels = database.channels
    .filter((item) => item.serverId === server.id)
    .sort((a, b) => a.position - b.position);
  return {
    ...server,
    memberCount,
    role: database.memberships.find(
      (item) => item.serverId === server.id && item.userId === user.id,
    )?.role,
    channels,
    permissions: roleForMembership(server, membershipFor(user, server.id))?.permissions || {},
    actorRoleId: roleForMembership(server, membershipFor(user, server.id))?.id,
    actorPosition: roleForMembership(server, membershipFor(user, server.id))?.position ?? 999,
  };
}
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function mentionInfoFor(server, content, authorId) {
  const targetIds = new Set();
  const members = database.memberships.filter((item) => item.serverId === server.id);
  const mentionEveryone = /(^|\s)@everyone(?=$|[\s,.!?])/i.test(content);
  const mentionHere = /(^|\s)@here(?=$|[\s,.!?])/i.test(content);
  const roleMentions = normalizedRoles(server.roles)
    .filter((role) => !["owner", "member"].includes(role.id))
    .filter((role) => new RegExp(`(^|\\s)@${escapeRegExp(role.name)}(?=$|[\\s,.!?])`, "i").test(content));
  for (const membership of members) {
    const target = database.users.find((item) => item.id === membership.userId);
    if (!target || target.id === authorId) continue;
    const direct = new RegExp(`(^|\\s)@${escapeRegExp(target.username)}(?=$|[\\s,.!?])`, "i").test(content);
    const byRole = roleMentions.some((role) => membership.roleId === role.id);
    if (direct || mentionEveryone || (mentionHere && sockets.has(target.id)) || byRole)
      targetIds.add(target.id);
  }
  return {
    targetIds,
    requiresMentionPermission: mentionEveryone || mentionHere || roleMentions.length > 0,
  };
}
function sendMentionNotification(userId, event) {
  const socket = sockets.get(userId);
  if (socket?.readyState === 1) socket.send(JSON.stringify(event));
}
function broadcast(channelId, event) {
  for (const [userId, socket] of sockets) {
    if (socket.readyState === 1) {
      const userChannels = database.channels.filter(
        (channel) =>
          channel.id === channelId &&
          database.memberships.some(
            (m) => m.serverId === channel.serverId && m.userId === userId,
          ),
      );
      if (userChannels.length) socket.send(JSON.stringify(event));
    }
  }
}
function broadcastServer(serverId, event) {
  for (const [userId, socket] of sockets) {
    if (
      socket.readyState === 1 &&
      serverForUser(
        database.users.find((user) => user.id === userId),
        serverId,
      )
    )
      socket.send(JSON.stringify(event.type === "server.updated" ? { ...event, server: decorateServer(database.servers.find(item => item.id === serverId), database.users.find(item => item.id === userId)) } : event));
  }
}
function voiceParticipants(channelId) {
  return [...(voiceRooms.get(channelId)?.entries() || [])]
    .map(([userId, media]) => {
      const user = publicUser(
        database.users.find((item) => item.id === userId),
      );
      return user
        ? {
            ...user,
            camera: Boolean(media?.camera),
            screen: Boolean(media?.screen),
          }
        : null;
    })
    .filter(Boolean);
}
function broadcastVoice(channelId, event) {
  for (const userId of voiceRooms.get(channelId)?.keys() || []) {
    const socket = sockets.get(userId);
    if (socket?.readyState === 1) socket.send(JSON.stringify(event));
  }
}
function broadcastVoiceState(channel) {
  const event = JSON.stringify({
    type: "voice.state",
    serverId: channel.serverId,
    channelId: channel.id,
    participants: voiceParticipants(channel.id),
  });
  for (const [userId, socket] of sockets) {
    if (socket.readyState !== 1) continue;
    const member = database.users.find((item) => item.id === userId);
    if (member && serverForUser(member, channel.serverId)) socket.send(event);
  }
}
function voiceStatesFor(serverId) {
  return [...voiceRooms.entries()]
    .filter(([cid]) =>
      database.channels.some((c) => c.id === cid && c.serverId === serverId),
    )
    .map(([cid]) => ({ channelId: cid, participants: voiceParticipants(cid) }));
}

async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (
    ["POST", "PATCH", "DELETE"].includes(req.method) &&
    !requestOriginAllowed(req)
  )
    return json(res, 403, { error: "Origem da requisicao nao permitida." });
  try {
    if (url.pathname === "/api/health") {
      if (pgClient) await pgClient.query("SELECT 1");
      return json(res, 200, { ok: true, version: APP_VERSION, storage: pgClient ? "postgresql" : "local" });
    }
    if (url.pathname === "/api/auth/verify-email" && req.method === "GET") {
      const token = String(url.searchParams.get("token") || "");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const record = database.emailVerifications.find((item) => item.tokenHash === tokenHash);
      if (!record || new Date(record.expiresAt).getTime() < Date.now())
        return json(res, 400, { error: "Link de confirmação inválido ou expirado." });
      const target = database.users.find((item) => item.id === record.userId);
      if (!target) return json(res, 404, { error: "Conta não encontrada." });
      target.emailVerifiedAt = now();
      database.emailVerifications = database.emailVerifications.filter((item) => item.userId !== target.id);
      await saveDatabase();
      res.writeHead(302, { Location: "/app?email_verified=1" });
      return res.end();
    }
    if (url.pathname === "/api/auth/register" && req.method === "POST") {
      const input = await body(req);
      const username = String(input.username || "")
        .trim()
        .toLowerCase();
      const displayName = String(input.displayName || username).trim();
      const email = String(input.email || "")
        .trim()
        .toLowerCase();
      const phone = String(input.phone || "").trim();
      const phoneDigits = phone.replace(/\D/g, "");
      if (!username || String(input.password || "").length < 6)
        return json(res, 400, {
          error:
            "Usuário e senha com pelo menos 6 caracteres são obrigatórios.",
        });
      if (!/^[a-z0-9_.-]{1,20}$/.test(username))
        return json(res, 400, {
          error:
            "Usuário inválido: use até 20 caracteres (letras, números, ponto, hífen ou underline), sem espaços.",
        });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
        return json(res, 400, {
          error: "Informe um e-mail verdadeiro e válido (ex.: voce@email.com).",
        });
      if (phone && (phoneDigits.length < 10 || phoneDigits.length > 15))
        return json(res, 400, {
          error: "Informe um telefone válido, com DDD.",
        });
      if (database.users.some((user) => user.username === username))
        return json(res, 409, {
          error: "Este nome de usuário já está em uso.",
        });
      if (
        database.users.some(
          (user) => (user.email || "").toLowerCase() === email,
        )
      )
        return json(res, 409, { error: "Este e-mail já está cadastrado." });
      const user = {
        id: id(),
        username,
        displayName,
        email,
        phone: phoneDigits || null,
        // Email ownership is optional, not a login or voice requirement.
        emailVerifiedAt: null,
        password: hashPassword(input.password),
        avatarColor: "purple",
        createdAt: now(),
      };
      database.users.push(user);
      await saveDatabase();
      const token = id();
      sessions.set(token, user.id);
      setSessionCookie(res, token);
      // Registration must never wait for an external email provider.
      return json(res, 201, { token, user: sessionUser(user), verificationRequired: false, verificationEmailSent: false });
    }
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      const input = await body(req);
      const rawIdentifier = String(input.username || input.email || "").trim().toLowerCase();
      const handle = rawIdentifier.match(/^@?([a-z0-9_.-]{1,20})(?:#(\d{4}))?$/);
      const identifier = handle ? handle[1] : rawIdentifier;
      const suppliedTag = handle?.[2];
      if (loginBlocked(req, identifier))
        return json(res, 429, {
          error: "Muitas tentativas. Aguarde 15 minutos e tente novamente.",
        });
      const user = database.users.find(
        (item) =>
          (String(item.username).toLowerCase() === identifier && (!suppliedTag || userTag(item) === suppliedTag)) ||
          (item.email || "").toLowerCase() === identifier,
      );
      if (!user || !verifyPassword(input.password || "", user.password)) {
        recordLoginFailure(req, identifier);
        return json(res, 401, { error: "Usuário ou senha incorretos. Entre com seu nome de usuário, @usuário#tag ou e-mail de cadastro (não o nome de exibição)." });
      }
      loginAttempts.delete(loginLimitKey(req, identifier));
      const token = id();
      sessions.set(token, user.id);
      setSessionCookie(res, token);
      return json(res, 200, { token, user: sessionUser(user) });
    }
    if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
      const distDir = path.join(__dirname, "dist");
      const resolved = path.resolve(
        path.join(distDir, decodeURIComponent(url.pathname)),
      );
      if (
        resolved === distDir ||
        resolved.startsWith(`${distDir}${path.sep}`)
      ) {
        try {
          const data = await fs.readFile(resolved);
          const types = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript",
            ".css": "text/css",
            ".png": "image/png",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
            ".json": "application/json",
            ".webp": "image/webp",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".woff2": "font/woff2",
          };
          res.writeHead(200, {
            ...securityHeaders(),
            "Content-Type":
              types[path.extname(resolved).toLowerCase()] ||
              "application/octet-stream",
          });
          return res.end(data);
        } catch {
          /* cai para o index.html (SPA) */
        }
        try {
          const index = await fs.readFile(path.join(distDir, "index.html"));
          res.writeHead(200, {
            ...securityHeaders(),
            "Content-Type": "text/html; charset=utf-8",
          });
          return res.end(index);
        } catch {
          /* dist ainda não existe */
        }
      }
    }
    let user = getUser(req);
    if (!user) return json(res, 401, { error: "Autenticação necessária." });
    if (url.pathname === "/api/auth/logout" && req.method === "POST") {
      sessions.delete(sessionToken(req));
      clearSessionCookie(res);
      return json(res, 200, { ok: true });
    }
    if (url.pathname === "/api/auth/ws-ticket" && req.method === "POST") {
      const ticket = crypto.randomBytes(24).toString("base64url");
      wsTickets.set(ticket, { userId: user.id, expiresAt: Date.now() + 30_000 });
      return json(res, 201, { ticket });
    }
    if (url.pathname === "/api/subscriptions/plans" && req.method === "GET")
      return json(res, 200, { plans: Object.values(SUBSCRIPTION_PLANS) });
    if (url.pathname === "/api/subscriptions/me" && req.method === "GET") {
      const subscription = activeSubscriptionFor(user.id) || null;
      return json(res, 200, {
        subscription,
        badges: subscriptionBadges(user),
      });
    }
    const adminSubscriptionMatch = url.pathname.match(new RegExp("^/api/admin/users/([^/]+)/subscription$"));
    if (adminSubscriptionMatch && req.method === "PATCH") {
      if (!isMasterAdmin(user))
        return json(res, 403, { error: "Acesso de admin master necessário." });
      const target = database.users.find(
        (item) => item.id === adminSubscriptionMatch[1],
      );
      if (!target) return json(res, 404, { error: "Usuário não encontrado." });
      const input = await body(req);
      const plan = SUBSCRIPTION_PLANS[input.planId];
      if (!plan) return json(res, 400, { error: "Plano inválido." });
      if (input.status !== "active" && input.status !== "canceled")
        return json(res, 400, { error: "Status inválido." });
      let subscription = database.subscriptions.find(
        (item) => item.userId === target.id && item.planId === plan.id,
      );
      if (!subscription) {
        const earlySupporter =
          input.status === "active" &&
          database.subscriptions.filter((item) => item.earlySupporter).length < 100;
        subscription = {
          id: id(),
          userId: target.id,
          planId: plan.id,
          status: input.status,
          earlySupporter,
          startedAt: now(),
          updatedAt: now(),
          provider: String(input.provider || "manual"),
          providerReference: String(input.providerReference || "").slice(0, 120),
        };
        database.subscriptions.push(subscription);
      } else {
        subscription.status = input.status;
        subscription.updatedAt = now();
      }
      await saveDatabase();
      const output = publicUser(target);
      broadcastAll({ type: "user.updated", user: output });
      return json(res, 200, { subscription, user: output });
    }
    if (url.pathname === "/api/catalog" && req.method === "GET")
      return json(res, 200, {
        items: database.adminCatalog.filter((item) => item.active !== false),
      });
    if (url.pathname === "/api/games" && req.method === "GET") {
      const query = String(url.searchParams.get("q") || "").trim().toLowerCase();
      return json(res, 200, {
        games: GAME_CATALOG.filter((game) => !query || game.name.toLowerCase().includes(query))
          .slice(0, 400),
      });
    }
    if (url.pathname === "/api/admin/catalog" && req.method === "GET") {
      if (!isMasterAdmin(user))
        return json(res, 403, { error: "Acesso de admin master necessário." });
      return json(res, 200, { items: database.adminCatalog });
    }
    if (url.pathname === "/api/admin/catalog" && req.method === "POST") {
      if (!isMasterAdmin(user))
        return json(res, 403, { error: "Acesso de admin master necessário." });
      const input = await body(req);
      const type = String(input.type || "");
      if (!["banner", "effect", "frame"].includes(type))
        return json(res, 400, { error: "Tipo de item inválido." });
      const name = String(input.name || "").trim().slice(0, 50);
      if (!name) return json(res, 400, { error: "Nome obrigatório." });
      const value = String(input.value || "").trim().slice(0, 4_000_000);
      if (!value) return json(res, 400, { error: "Valor obrigatório." });
      if (type === "banner" && !safeImageDataUrl(value) && !/^#[0-9a-fA-F]{6}$/.test(value))
        return json(res, 400, { error: "Banner inválido." });
      if (type === "effect" && !["sparkles", "glow", "embers"].includes(value))
        return json(res, 400, { error: "Efeito inválido." });
      if (type === "frame" && !["ruby", "gold", "neon", "ice"].includes(value))
        return json(res, 400, { error: "Moldura inválida." });
      const item = { id: id(), type, name, value, active: true, createdAt: now() };
      database.adminCatalog.push(item);
      await saveDatabase();
      return json(res, 201, { item });
    }
    const catalogItemMatch = url.pathname.match(new RegExp("^/api/admin/catalog/([^/]+)$"));
    if (catalogItemMatch && req.method === "DELETE") {
      if (!isMasterAdmin(user))
        return json(res, 403, { error: "Acesso de admin master necessário." });
      const item = database.adminCatalog.find((entry) => entry.id === catalogItemMatch[1]);
      if (!item) return json(res, 404, { error: "Item não encontrado." });
      item.active = false;
      await saveDatabase();
      return json(res, 200, { ok: true });
    }
    if (url.pathname === "/api/auth/resend-verification" && req.method === "POST") {
      if (user.emailVerifiedAt) return json(res, 400, { error: "Seu e-mail já está confirmado." });
      const recent = database.emailVerifications.find((item) => item.userId === user.id);
      if (recent && Date.now() - new Date(recent.createdAt).getTime() < 60_000)
        return json(res, 429, { error: "Aguarde um minuto para reenviar." });
      try {
        const result = await issueEmailVerification(user);
        if (!result.configured) return json(res, 503, { error: "Envio de e-mail ainda não foi configurado." });
        return json(res, 200, { ok: true });
      } catch (err) { return json(res, 502, { error: err.message }); }
    }
    if (url.pathname === "/api/auth/me" && req.method === "GET") {
      if (req.headers.authorization) setSessionCookie(res, sessionToken(req));
      return json(res, 200, { user: sessionUser(user) });
    }
    if (url.pathname === "/api/auth/me" && req.method === "PATCH") {
      const input = await body(req);
      const storedUser = user;
      user = { ...user };
      if (!badgesForUser(user).includes("nitro_classic") &&
          [input.avatar, input.banner].some(value => typeof value === "string" && /^data:image\/gif;/i.test(value)))
        return json(res, 403, { error: "GIF no avatar ou banner é exclusivo de contas com a insígnia Nitro Classic." });
      // Never allow changing a profile email to claim an administrator identity.
      if (input.email !== undefined && String(input.email).trim().toLowerCase() !== user.email &&
          (isCreator(user) || MASTER_ADMIN_EMAILS.has(String(input.email).trim().toLowerCase()) || CREATOR_EMAILS.has(String(input.email).trim().toLowerCase())))
        return json(res, 403, { error: "O e-mail de uma conta administrativa não pode ser alterado por este formulário." });
      const displayName =
        input.displayName !== undefined
          ? String(input.displayName).trim()
          : user.displayName;
      const username =
        input.username !== undefined
          ? String(input.username).trim().toLowerCase()
          : user.username;
      if (!displayName)
        return json(res, 400, { error: "Nome de exibição é obrigatório." });
      if (!/^[a-z0-9_.-]{1,20}$/.test(username))
        return json(res, 400, {
          error:
            "Usuário inválido: use até 20 caracteres (letras, números, ponto, hífen ou underline), sem espaços.",
        });
      if (
        database.users.some(
          (item) => item.username === username && item.id !== user.id,
        )
      )
        return json(res, 409, {
          error: "Este nome de usuário já está em uso.",
        });
      if (input.bio !== undefined) user.bio = String(input.bio).slice(0, 300);
      if (input.email !== undefined) {
        const email = String(input.email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
          return json(res, 400, { error: "E-mail inválido." });
        if (
          database.users.some(
            (item) =>
              item.id !== user.id && (item.email || "").toLowerCase() === email,
          )
        )
          return json(res, 409, { error: "Este e-mail já está cadastrado." });
        if (email !== user.email) {
          user.email = email;
        }
      }
      if (input.password !== undefined) {
        if (String(input.password).length < 6)
          return json(res, 400, {
            error: "A nova senha precisa ter pelo menos 6 caracteres.",
          });
        user.password = hashPassword(String(input.password));
      }
      if (input.avatar !== undefined) {
        if (input.avatar === null || input.avatar === "") user.avatar = null;
        else if (
          safeImageDataUrl(input.avatar)
        )
          user.avatar = input.avatar;
        else
          return json(res, 400, {
            error: "Foto inválida: use uma imagem de até 3 MB.",
          });
      }
      if (input.banner !== undefined) {
        if (input.banner === null || input.banner === "") user.banner = null;
        else if (
          safeImageDataUrl(input.banner)
        )
          user.banner = input.banner;
        else if (
          typeof input.banner === "string" &&
          /^#[0-9a-fA-F]{6}$/.test(input.banner)
        )
          user.banner = input.banner;
        else
          return json(res, 400, {
            error: "Banner inválido: use uma imagem de até 3 MB ou uma cor.",
          });
      }
      if (input.nameStyle !== undefined)
        user.nameStyle = [
          "default",
          "serif",
          "pixel",
          "gothic",
          "rounded",
          "bubble",
          "block",
          "mono",
          "script",
          "display",
          "blackletter",
          "handwritten",
        ].includes(input.nameStyle)
          ? input.nameStyle
          : "default";
      if (input.nameColor !== undefined)
        user.nameColor = /^#[0-9a-fA-F]{6}$/.test(String(input.nameColor))
          ? String(input.nameColor)
          : "#f1f3f5";
      if (input.nameEffect !== undefined)
        user.nameEffect = [
          "solid",
          "neon",
          "gradient",
          "outline",
          "desenho",
          "pop",
          "gummy",
          "prism",
          "rgb",
          "rainbow",
          "pink_pulse",
          "blue_gradient",
          "aurora",
          "holographic",
          "glitch",
          "fire",
          "ice",
          "starlight",
        ].includes(input.nameEffect)
          ? input.nameEffect
          : "solid";
      for (const field of ["profilePrimaryColor", "profileAccentColor"]) {
        if (input[field] === undefined) continue;
        if (input[field] !== null && (typeof input[field] !== "string" || !/^#[0-9a-fA-F]{6}$/.test(input[field])))
          return json(res, 400, {error: "Cor do perfil inválida."});
        user[field] = input[field];
      }
      for (const field of ["bannerPositionX", "bannerPositionY"]) {
        if (input[field] === undefined) continue;
        if (typeof input[field] !== "number" || !Number.isFinite(input[field]) || input[field] < 0 || input[field] > 100)
          return json(res, 400, {error: "Posição do banner inválida."});
        user[field] = input[field];
      }
      for (const [field, allowed] of Object.entries({
        bannerPreset: ["aurora","midnight","sunset","ocean","forest","candy","ember","silver"],
        effectIntensity: ["subtle","balanced","vivid"], effectSpeed: ["slow","normal","fast"],
        profileOverlay: PROFILE_OVERLAYS.map(([id])=>id)
      })) {
        if (input[field] === undefined) continue;
        if (!allowed.includes(input[field])) return json(res, 400, {error: "Personalização de perfil inválida."});
        user[field] = input[field];
      }
      if (input.profileTheme !== undefined)
        user.profileTheme = [
          "default",
          "purple",
          "red",
          "green",
          "blue",
          "pink",
          "midnight",
          "sunset",
          "ocean",
          "aurora",
        ].includes(input.profileTheme)
          ? input.profileTheme
          : "default";
      if (input.profilePlate !== undefined)
        user.profilePlate = ["default", "stars", "waves", "neon", "clouds", "flora", "holo"].includes(
          input.profilePlate,
        )
          ? input.profilePlate
          : "default";
      if (input.profileEffect !== undefined)
        user.profileEffect = PROFILE_EFFECTS.map(([value]) => value).includes(
          input.profileEffect,
        )
          ? input.profileEffect
          : "none";
      if (input.avatarFrame !== undefined)
        user.avatarFrame = AVATAR_FRAMES.map(([value]) => value).includes(
          input.avatarFrame,
        )
          ? input.avatarFrame
          : "none";
      if (input.favoriteGame !== undefined)
        user.favoriteGame = String(input.favoriteGame || "")
          .trim()
          .slice(0, 80);
      if (input.gameInterests !== undefined) {
        if (!Array.isArray(input.gameInterests))
          return json(res, 400, { error: "Lista de jogos inválida." });
        user.gameInterests = [...new Set(input.gameInterests.map(String))]
          .filter((gameId) => GAME_IDS.has(gameId))
          .slice(0, 12);
        // One source of truth: the first selected interest is the featured game.
        user.favoriteGame = GAME_CATALOG.find((game) => game.id === user.gameInterests[0])?.name || "";
      }
      if (input.activityText !== undefined)
        user.activityText = String(input.activityText || "")
          .trim()
          .slice(0, 120);
      if (input.wishlist !== undefined)
        user.wishlist = String(input.wishlist || "")
          .trim()
          .slice(0, 300);
      if (input.badges !== undefined) {
        if (!isMasterAdmin(user))
          return json(res, 403, {
            error: "Somente o admin master pode gerenciar insígnias.",
          });
        user.badges = sanitizeBadges(user, input.badges);
      }
      if (input.status !== undefined) {
        const allowedStatus = ["online", "idle", "dnd", "invisible"];
        user.status = allowedStatus.includes(input.status)
          ? input.status
          : "online";
      }
      if (input.preferences !== undefined) {
        if (!input.preferences || typeof input.preferences !== "object" || Array.isArray(input.preferences))
          return json(res, 400, { error: "Preferências inválidas." });
        user.preferences = { ...user.preferences };
        for (const key of ["allowDirectMessages", "notificationSounds", "reducedMotion"])
          if (input.preferences[key] !== undefined) user.preferences[key] = Boolean(input.preferences[key]);
      }
      user.displayName = displayName;
      user.username = username;
      Object.assign(storedUser, user);
      await saveDatabase();
      const output = publicUser(user);
      broadcastAll({ type: "user.updated", user: output });
      broadcastAll({
        type: "presence.updated",
        userId: user.id,
        presence: presenceOf(user),
      });
      return json(res, 200, { user: sessionUser(user) });
    }
    const profileMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
    if (profileMatch && req.method === "GET") {
      const target = database.users.find((item) => item.id === profileMatch[1]);
      if (!target || !canViewUser(user, target))
        return json(res, 404, { error: "Usuário não encontrado." });

      let voice = null;
      for (const [channelId, room] of voiceRooms)
        if (room.has(target.id)) {
          const channel = database.channels.find(
            (item) => item.id === channelId,
          );
          if (channel && channelForUser(user, channel.id))
            voice = { channelId: channel.id, channelName: channel.name };
        }
      return json(res, 200, { user: publicUser(target), voice });
    }
    const badgeMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/badges$/);
    if (badgeMatch && req.method === "PATCH") {
      if (!isMasterAdmin(user))
        return json(res, 403, {
          error: "Somente o admin master pode gerenciar insígnias.",
        });
      const target = database.users.find((item) => item.id === badgeMatch[1]);
      if (!target) return json(res, 404, { error: "Usuário não encontrado." });
      const input = await body(req);
      target.badges = sanitizeBadges(target, input.badges);
      await saveDatabase();
      const output = publicUser(target);
      broadcastAll({ type: "user.updated", user: output });
      return json(res, 200, { user: output });
    }
    if (url.pathname === "/api/servers" && req.method === "GET")
      return json(res, 200, {
        servers: database.servers
          .filter((server) => serverForUser(user, server.id))
          .map((server) => decorateServer(server, user)),
      });
    if (url.pathname === "/api/servers" && req.method === "POST") {
      const input = await body(req);
      const name = String(input.name || "").trim();
      if (!name)
        return json(res, 400, { error: "Nome do servidor é obrigatório." });
      let icon = initials(name).slice(0, 1);
      if (
        safeImageDataUrl(input.icon)
      )
        icon = input.icon;
      else if (typeof input.icon === "string" && input.icon)
        return json(res, 400, { error: "Ícone inválido." });
      const server = {
        inviteCode: crypto.randomBytes(12).toString("base64url"),
        id: id(),
        roles: defaultRoles(),
        name,
        icon,
        tag: String(input.tag || initials(name))
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 4)
          .toUpperCase(),
        banner: null,
        accentColor: "#c93642",
        ownerId: user.id,
        createdAt: now(),
      };
      database.servers.push(server);
      database.memberships.push({
        userId: user.id,
        serverId: server.id,
        role: "owner", roleId: "owner",
        joinedAt: now(),
      });
      const templates = {
        gaming: [
          ["geral", "text"],
          ["clips", "text"],
          ["Geral", "voice"],
        ],
        friends: [
          ["geral", "text"],
          ["conversa", "text"],
          ["Papo voz", "voice"],
        ],
        study: [
          ["geral", "text"],
          ["duvidas", "text"],
          ["recursos", "text"],
          ["Estudos voz", "voice"],
        ],
        school: [
          ["geral", "text"],
          ["trabalhos", "text"],
          ["avisos", "text"],
          ["Sala voz", "voice"],
        ],
      };
      const layout = templates[input.template] || [
        ["geral", "text"],
        ["Call da comunidade", "voice"],
      ];
      const channels = layout.map(([channelName, type], position) => ({
        id: id(),
        serverId: server.id,
        name: channelName.toLowerCase(),
        type,
        topic: type === "text" ? "Comece uma conversa" : "Converse por áudio",
        position,
        createdAt: now(),
      }));
      database.channels.push(...channels);
      const general = channels.find((channel) => channel.type === "text");
      database.messages.push({
        id: id(),
        channelId: general.id,
        authorId: user.id,
        content: `Bem-vindo ao ${name}! Este é o começo da sua comunidade.`,
        createdAt: now(),
        editedAt: null,
      });
      await saveDatabase();
      return json(res, 201, { server: decorateServer(server, user) });
    }
    const serverRootMatch = url.pathname.match(/^\/api\/servers\/([^/]+)$/);
    if (serverRootMatch && req.method === "PATCH") {
      const storedServer = serverForUser(user, serverRootMatch[1]);
      const server = storedServer && structuredClone(storedServer);
      if (!server) return json(res, 404, { error: "Servidor não encontrado." });
      const input = await body(req);
      const isOwner = server.ownerId === user.id;
      const actorRole = roleForMembership(server, membershipFor(user, server.id));
      if (["name", "icon", "tag", "inviteCode", "banner", "accentColor"].some(key => input[key] !== undefined) && !hasServerPermission(user, server, "manageServer"))
        return json(res, 403, { error: "Seu cargo não pode gerenciar este servidor." });
      if ((input.roles !== undefined || input.memberRoles !== undefined) && !hasServerPermission(user, server, "manageRoles"))
        return json(res, 403, { error: "Seu cargo não pode gerenciar cargos." });
      const membershipUpdates = new Map();
      if (input.name !== undefined) {
        const name = String(input.name).trim().slice(0, 80);
        if (!name) return json(res, 400, { error: "Nome é obrigatório." });
        server.name = name;
      }
      if (input.icon !== undefined) {
        if (input.icon === null || input.icon === "")
          server.icon = initials(server.name).slice(0, 1);
        else if (typeof input.icon === "string" && /^[\p{L}\p{N}]{1,2}$/u.test(input.icon))
          // O editor reenviava as iniciais atuais do servidor, que são válidas.
          server.icon = input.icon;
        else if (safeImageDataUrl(input.icon))
          server.icon = input.icon;
        else return json(res, 400, { error: "Ícone inválido." });
      }
      if (input.tag !== undefined) {
        const tag = String(input.tag || "")
          .trim()
          .toUpperCase();
        if (tag && !/^[A-Z0-9]{2,4}$/.test(tag))
          return json(res, 400, {
            error: "A tag deve ter de 2 a 4 letras ou números.",
          });
        server.tag = tag;
      }
      if (input.inviteCode !== undefined) {
        const inviteCode = String(input.inviteCode || "")
          .trim()
          .toLowerCase();
        if (!/^[a-z0-9-]{3,32}$/.test(inviteCode))
          return json(res, 400, {
            error: "O convite deve ter 3 a 32 letras, números ou hífens.",
          });
        if (
          database.servers.some(
            (item) => item.id !== server.id && item.inviteCode === inviteCode,
          )
        )
          return json(res, 409, { error: "Esse convite já está em uso." });
        server.inviteCode = inviteCode;
      }
      if (input.banner !== undefined) {
        if (input.banner === null || input.banner === "") server.banner = null;
        else if (
          safeImageDataUrl(input.banner)
        )
          server.banner = input.banner;
        else
          return json(res, 400, { error: "Banner inválido ou muito grande." });
      }
      if (input.accentColor !== undefined) {
        const color = String(input.accentColor);
        if (!/^#[0-9a-fA-F]{6}$/.test(color))
          return json(res, 400, { error: "Cor inválida." });
        server.accentColor = color;
      }
      if (input.roles !== undefined) {
        if (!Array.isArray(input.roles)) return json(res, 400, { error: "Lista de cargos inválida." });
        const nextRoles = normalizedRoles(input.roles);
        if (!isOwner) {
          const previous = normalizedRoles(server.roles);
          const protectedRoles = previous.filter(role => role.position <= actorRole.position || role.id === "member");
          for (const role of protectedRoles)
            if (JSON.stringify({ ...nextRoles.find(item => item.id === role.id), ...(role.id === "member" ? { position: 0 } : {}) }) !== JSON.stringify({ ...role, ...(role.id === "member" ? { position: 0 } : {}) }))
              return json(res, 403, { error: "Você não pode alterar seu cargo, cargos superiores ou permissões padrão." });
          for (const role of nextRoles.filter(role => !protectedRoles.some(item => item.id === role.id))) {
            if (role.position <= actorRole.position || ROLE_PERMISSIONS.some(key => role.permissions[key] && !actorRole.permissions[key]))
              return json(res, 403, { error: "Você só pode criar cargos inferiores com permissões que já possui." });
          }
        }
        server.roles = nextRoles;
        const validRoleIds = new Set(server.roles.map((role) => role.id));
        for (const membership of database.memberships)
          if (
            membership.serverId === server.id &&
            !validRoleIds.has(membership.roleId)
          )
            membershipUpdates.set(membership, membership.userId === server.ownerId ? "owner" : "member");
      }
      if (input.memberRoles !== undefined) {
        if (!input.memberRoles || typeof input.memberRoles !== "object")
          return json(res, 400, { error: "Atribuição de cargos inválida." });
        const validRoleIds = new Set(
          normalizedRoles(server.roles).map((role) => role.id),
        );
        for (const [userId, roleId] of Object.entries(input.memberRoles)) {
          const membership = database.memberships.find(
            (item) => item.serverId === server.id && item.userId === userId,
          );
          if (!membership || userId === server.ownerId || membership.roleId === roleId) continue;
          if (!isOwner && (roleForMembership(storedServer, membership)?.position <= actorRole.position || normalizedRoles(server.roles).find(role => role.id === roleId)?.position <= actorRole.position))
            return json(res, 403, { error: "Você só pode atribuir cargos inferiores a membros abaixo do seu cargo." });
          if (!validRoleIds.has(roleId) || roleId === "owner")
            return json(res, 400, { error: "Cargo inválido." });
          membershipUpdates.set(membership, roleId);
        }
      }
      Object.assign(storedServer, server);
      for (const [membership, roleId] of membershipUpdates) {
        membership.roleId = roleId;
        membership.role = roleId === "owner" ? "owner" : roleId === "member" ? "member" : "custom";
      }
      await saveDatabase();
      broadcastServer(server.id, {
        type: "server.updated",
        serverId: server.id,
        server: decorateServer(server, user),
      });
      return json(res, 200, { server: decorateServer(server, user) });
    }
    const serverMatch = url.pathname.match(/^\/api\/servers\/([^/]+)$/);
    const memberModerationMatch = url.pathname.match(
      /^\/api\/servers\/([^/]+)\/members\/([^/]+)\/moderation$/,
    );
    const channelMatch = url.pathname.match(
      /^\/api\/channels\/([^/]+)\/messages$/,
    );
    const channelRootMatch = url.pathname.match(/^\/api\/channels\/([^/]+)$/);
    if (memberModerationMatch && req.method === "PATCH") {
      const server = serverForUser(user, memberModerationMatch[1]);
      if (!server || !hasServerPermission(user, server, "manageMembers"))
        return json(res, 403, { error: "Seu cargo não pode moderar membros." });
      const target = database.memberships.find(
        (membership) => membership.serverId === server.id && membership.userId === memberModerationMatch[2],
      );
      if (!target || target.userId === server.ownerId)
        return json(res, 403, { error: "Membro não disponível para moderação." });
      const actor = membershipFor(user, server.id);
      const actorPosition = roleForMembership(server, actor)?.position ?? 999;
      const targetPosition = roleForMembership(server, target)?.position ?? 999;
      if (user.id !== server.ownerId && actorPosition >= targetPosition)
        return json(res, 403, { error: "Você só pode moderar cargos abaixo do seu." });

      const input = await body(req);
      if (input.textMuted === undefined && input.voiceMuted === undefined && input.roleId === undefined)
        return json(res, 400, { error: "Informe uma ação de moderação." });
      if (input.roleId !== undefined) {
        const role = normalizedRoles(server.roles).find((item) => item.id === input.roleId);
        if (!role || role.id === "owner")
          return json(res, 400, { error: "Cargo inválido." });
        if (user.id !== server.ownerId && role.position <= actorPosition)
          return json(res, 403, { error: "Você só pode atribuir cargos abaixo do seu." });
        target.roleId = role.id;
        target.role = role.id === "member" ? "member" : "custom";
      }
      if (input.textMuted !== undefined) target.textMuted = Boolean(input.textMuted);
      if (input.voiceMuted !== undefined) target.voiceMuted = Boolean(input.voiceMuted);
      await saveDatabase();
      if (target.voiceMuted) {
        for (const channel of database.channels.filter(channel => channel.serverId === server.id && channel.type === "voice")) {
          const room = voiceRooms.get(channel.id);
          if (!room?.delete(target.userId)) continue;
          const socket = sockets.get(target.userId);
          if (socket?.readyState === 1) socket.send(JSON.stringify({ type: "voice.denied", channelId: channel.id, reason: "Sua voz foi silenciada pela moderação." }));
          broadcastVoice(channel.id, { type: "voice.participants", channelId: channel.id, participants: voiceParticipants(channel.id) });
          broadcastVoiceState(channel);
        }
      }
      const member = memberView(server, target);
      broadcastServer(server.id, {
        type: "member.moderation.updated",
        serverId: server.id,
        member,
      });
      return json(res, 200, { member });
    }
    if (serverMatch && req.method === "GET") {
      const server = serverForUser(user, serverMatch[1]);
      if (!server) return json(res, 404, { error: "Servidor não encontrado." });
      return json(res, 200, {
        server: decorateServer(server, user),
        members: database.memberships
          .filter((m) => m.serverId === server.id)
          .map((m) => memberView(server, m))
          .filter(Boolean)
          .sort((a, b) => (a.serverRole?.position ?? 999) - (b.serverRole?.position ?? 999)),
        voice: voiceStatesFor(server.id),
      });
    }
    if (serverMatch && req.method === "DELETE") {
      const server = serverForUser(user, serverMatch[1]);
      if (!server) return json(res, 404, { error: "Servidor não encontrado." });
      if (server.ownerId === user.id)
        return json(res, 400, {
          error: "O dono não pode sair do servidor. Transfira a propriedade primeiro.",
        });
      database.memberships = database.memberships.filter(
        (membership) =>
          !(membership.serverId === server.id && membership.userId === user.id),
      );
      await saveDatabase();
      return json(res, 200, { ok: true, serverId: server.id });
    }
    if (serverMatch && req.method === "POST") {
      const server = serverForUser(user, serverMatch[1]);
      if (!server || !hasServerPermission(user, server, "manageChannels"))
        return json(res, 403, { error: "Seu cargo não pode criar canais." });
      const input = await body(req);
      const channel = {
        id: id(),
        serverId: server.id,
        name: String(input.name || "novo-canal")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-"),
        type: input.type === "voice" ? "voice" : "text",
        topic: input.topic || "",
        position: database.channels.filter((c) => c.serverId === server.id)
          .length,
        createdAt: now(),
      };
      database.channels.push(channel);
      await saveDatabase();
      broadcastServer(server.id, {
        type: "channel.created",
        serverId: server.id,
        channel,
      });
      return json(res, 201, { channel });
    }
    if (channelRootMatch && req.method === "DELETE") {
      const channel = channelForUser(user, channelRootMatch[1]);
      const server =
        channel &&
        database.servers.find((item) => item.id === channel.serverId);
      if (!channel || !server || !hasServerPermission(user, server, "manageChannels"))
        return json(res, 403, { error: "Sem permissão." });
      database.channels = database.channels.filter(
        (item) => item.id !== channel.id,
      );
      database.messages = database.messages.filter(
        (item) => item.channelId !== channel.id,
      );
      await saveDatabase();
      broadcastServer(server.id, {
        type: "channel.deleted",
        serverId: server.id,
        channelId: channel.id,
      });
      return json(res, 200, { ok: true });
    }
    if (channelRootMatch && req.method === "PATCH") {
      const channel = channelForUser(user, channelRootMatch[1]);
      const server =
        channel &&
        database.servers.find((item) => item.id === channel.serverId);
      if (!channel || !server || !hasServerPermission(user, server, "manageChannels"))
        return json(res, 403, { error: "Sem permissão." });
      const input = await body(req);
      if (input.name !== undefined) {
        const name = String(input.name)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
        if (!name)
          return json(res, 400, { error: "Nome do canal é obrigatório." });
        channel.name = name;
      }
      if (input.topic !== undefined) channel.topic = String(input.topic);
      await saveDatabase();
      broadcastServer(server.id, {
        type: "channel.updated",
        serverId: server.id,
        channel,
      });
      return json(res, 200, { channel });
    }
    const serverJoinMatch = url.pathname.match(
      /^\/api\/servers\/([^/]+)\/join$/,
    );
    if (serverJoinMatch && req.method === "POST") {
      const server = database.servers.find(
        (item) =>
          item.inviteCode === serverJoinMatch[1] ||
          item.id === serverJoinMatch[1],
      );
      if (!server)
        return json(res, 404, {
          error: "Servidor não encontrado. Verifique o ID do convite.",
        });
      if (
        !database.memberships.some(
          (m) => m.serverId === server.id && m.userId === user.id,
        )
      ) {
        const joinedMembership = {
          userId: user.id,
          serverId: server.id,
          role: "member", roleId: "member",
          joinedAt: now(),
        };
        database.memberships.push(joinedMembership);
        await saveDatabase();
        broadcastServer(server.id, {
          type: "member.joined",
          serverId: server.id,
          member: memberView(server, joinedMembership),
        });
      }
      return json(res, 200, { server: decorateServer(server, user) });
    }
    if (channelMatch && req.method === "GET") {
      const channel = channelForUser(user, channelMatch[1]);
      if (!channel) return json(res, 404, { error: "Canal não encontrado." });
      const requestedLimit = Number(url.searchParams.get("limit") || 100);
      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(Math.trunc(requestedLimit), 200))
        : 100;
      return json(res, 200, {
        messages: database.messages
          .filter((message) => message.channelId === channel.id)
          .slice(-limit)
          .map(decorateMessage),
      });
    }
    if (channelMatch && req.method === "POST") {
      const channel = channelForUser(user, channelMatch[1]);
      const input = await body(req);
      const content = String(input.content || "").trim();
      const attachment = input.attachment || null;
      if (input.attachment !== undefined && attachment && !safeAttachment(attachment))
        return json(res, 400, { error: "Imagem inválida: envie PNG, JPEG, GIF ou WebP de até 3 MB." });
      if (!channel || (!content && !attachment) || content.length > 4000)
        return json(res, 400, { error: "Mensagem inválida." });
      const server = database.servers.find((item) => item.id === channel.serverId);
      const membership = server && membershipFor(user, server.id);
      if (!server || !membership || !hasServerPermission(user, server, "sendMessages"))
        return json(res, 403, { error: "Seu cargo não pode enviar mensagens neste canal." });
      if (membership.textMuted)
        return json(res, 403, { error: "Você está silenciado no chat deste servidor." });
      if (attachment && !hasServerPermission(user, server, "attachFiles"))
        return json(res, 403, { error: "Seu cargo não pode enviar anexos." });
      const mentions = mentionInfoFor(server, content, user.id);
      if (mentions.requiresMentionPermission && !hasServerPermission(user, server, "mentionEveryone"))
        return json(res, 403, { error: "Seu cargo não pode mencionar @everyone, @here ou cargos." });
      const message = {
        id: id(),
        channelId: channel.id,
        authorId: user.id,
        content,
        attachment,
        createdAt: now(),
        editedAt: null,
      };
      database.messages.push(message);
      await saveDatabase();
      const output = decorateMessage(message);
      broadcast(channel.id, { type: "message.created", message: output });
      for (const targetUserId of mentions.targetIds)
        sendMentionNotification(targetUserId, {
          type: "mention.created",
          serverId: server.id,
          channelId: channel.id,
          channelName: channel.name,
          message: output,
        });
      return json(res, 201, { message: output });
    }
    const dmMatch = url.pathname.match(/^\/api\/direct\/([^/]+)\/messages$/);
    if (dmMatch && ["GET", "POST"].includes(req.method)) {
      const recipient = database.users.find((item) => item.id === dmMatch[1]);
      const friendship = database.friendships.some((item) => item.status === "accepted" &&
        [item.requesterId, item.addresseeId].includes(user.id) &&
        [item.requesterId, item.addresseeId].includes(recipient?.id));
      if (!recipient || recipient.id === user.id || !friendship)
        return json(res, 403, { error: "Adicione e aceite esta pessoa como amiga para conversar." });
      if (req.method === "GET") {
        const messages = database.directMessages.filter((item) =>
          (item.authorId === user.id && item.recipientId === recipient.id) ||
          (item.authorId === recipient.id && item.recipientId === user.id));
        return json(res, 200, { messages: messages.slice(-100).map(decorateMessage) });
      }
      if (recipient.preferences?.allowDirectMessages === false)
        return json(res, 403, { error: "Esta pessoa pausou o recebimento de mensagens diretas." });
      const input = await body(req);
      const content = String(input.content || "").trim();
      const attachment = input.attachment || null;
      if ((!content && !attachment) || content.length > 4000 || (attachment && !safeAttachment(attachment)))
        return json(res, 400, { error: "Envie até 4000 caracteres ou uma imagem PNG, JPEG, GIF ou WebP de até 3 MB." });
      const message = { id: id(), authorId: user.id, recipientId: recipient.id, content, attachment, createdAt: now(), editedAt: null };
      database.directMessages.push(message);
      await saveDatabase();
      const output = decorateMessage(message);
      notifyUser(recipient.id, { type: "direct.created", message: output });
      notifyUser(user.id, { type: "direct.created", message: output });
      return json(res, 201, { message: output });
    }
    if (url.pathname === "/api/friends" && req.method === "GET") {
      const friends = database.friendships
        .filter(
          (item) =>
            (item.requesterId === user.id || item.addresseeId === user.id) &&
            item.status === "accepted",
        )
        .map((item) => friendView(item, user.id))
        .filter(Boolean);
      const pending = database.friendships
        .filter(
          (item) =>
            (item.requesterId === user.id || item.addresseeId === user.id) &&
            item.status === "pending",
        )
        .map((item) => friendView(item, user.id))
        .filter(Boolean);
      return json(res, 200, { friends, pending });
    }
    if (url.pathname === "/api/friends" && req.method === "POST") {
      const input = await body(req);
      const friendId = String(input.username || "")
        .trim()
        .toLowerCase();
      const match = friendId.match(/^@?([a-z0-9_.-]{1,20})(?:#(\d{4}))?$/i);
      if (!match)
        return json(res, 400, {
          error: "Use o formato nome#0000 para adicionar um amigo.",
        });
      const [, username, tag] = match;
      const target = database.users.find(
        (item) =>
          item.username === username &&
          (!tag || userTag(item) === tag),
      );
      if (!target)
        return json(res, 404, {
          error: "Usuário não encontrado. Confira o nome (sem o @).",
        });
      if (target.id === user.id)
        return json(res, 400, { error: "Você não pode se adicionar." });
      const existing = database.friendships.find(
        (item) =>
          (item.requesterId === target.id && item.addresseeId === user.id) ||
          (item.requesterId === user.id && item.addresseeId === target.id),
      );
      if (existing) {
        if (existing.status === "accepted")
          return json(res, 409, { error: "Vocês já são amigos." });
        if (existing.requesterId === target.id) {
          existing.status = "accepted";
          await saveDatabase();
          notifyUser(target.id, { type: "friends.updated" });
          notifyUser(user.id, { type: "friends.updated" });
          return json(res, 200, { ok: true, accepted: true });
        }
        return json(res, 409, {
          error: "Você já enviou um convite para esta pessoa.",
        });
      }
      database.friendships.push({
        id: id(),
        requesterId: user.id,
        addresseeId: target.id,
        status: "pending",
        createdAt: now(),
      });
      await saveDatabase();
      notifyUser(target.id, { type: "friends.updated" });
      notifyUser(user.id, { type: "friends.updated" });
      return json(res, 201, { ok: true });
    }
    const friendMatch = url.pathname.match(
      /^\/api\/friends\/([^/]+)(\/accept)?$/,
    );
    if (friendMatch && req.method === "POST") {
      const friendship = database.friendships.find(
        (item) =>
          item.id === friendMatch[1] &&
          item.addresseeId === user.id &&
          item.status === "pending",
      );
      if (!friendship)
        return json(res, 404, { error: "Solicitação não encontrada." });
      friendship.status = "accepted";
      await saveDatabase();
      notifyUser(friendship.requesterId, { type: "friends.updated" });
      notifyUser(friendship.addresseeId, { type: "friends.updated" });
      return json(res, 200, { ok: true });
    }
    if (friendMatch && req.method === "DELETE") {
      const friendship = database.friendships.find(
        (item) =>
          item.id === friendMatch[1] &&
          (item.requesterId === user.id || item.addresseeId === user.id),
      );
      if (!friendship) return json(res, 404, { error: "Não encontrado." });
      database.friendships = database.friendships.filter(
        (item) => item !== friendship,
      );
      await saveDatabase();
      notifyUser(friendship.requesterId, { type: "friends.updated" });
      notifyUser(friendship.addresseeId, { type: "friends.updated" });
      return json(res, 200, { ok: true });
    }
    return json(res, 404, { error: "Rota não encontrada." });
  } catch (error) {
    const status = Number(error.status) || 500;
    if (status >= 500) console.error(error);
    return json(res, status, {
      error: status >= 500 ? "Erro interno do servidor." : error.message,
    });
  }
}

await loadDatabase();
const server = http.createServer(handler);
function validRealtimeRelay(event) {
  if (!event || typeof event.targetUserId !== "string") return false;
  if (event.targetUserId.length > 80) return false;
  if (event.type === "voice.ice")
    return (
      event.candidate &&
      typeof event.candidate === "object" &&
      typeof event.candidate.candidate === "string" &&
      event.candidate.candidate.length <= 4096
    );
  const description =
    event.type === "voice.offer" ? event.offer : event.answer;
  return (
    description &&
    typeof description === "object" &&
    ["offer", "answer"].includes(description.type) &&
    typeof description.sdp === "string" &&
    description.sdp.length <= 100_000
  );
}
const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 150_000 });
wss.on("connection", (socket, req) => {
  const ticket = new URL(
    req.url,
    `http://${req.headers.host}`,
  ).searchParams.get("ticket");
  const ticketData = wsTickets.get(ticket);
  wsTickets.delete(ticket);
  const userId =
    ticketData?.expiresAt > Date.now() ? ticketData.userId : null;
  if (!userId) return socket.close(1008, "Unauthorized");
  socket.isAlive = true;
  socket.on("pong", () => {
    socket.isAlive = true;
  });
  sockets.set(userId, socket);
  const connected = database.users.find((item) => item.id === userId);
  if (connected)
    broadcastAll({
      type: "presence.updated",
      userId,
      presence: presenceOf(connected),
    });
  socket.on("message", (raw) => {
    try {
      if (raw.length > 150_000) return socket.close(1009, "Message too large");
      const event = JSON.parse(raw.toString());
      if (event.type === "voice.join" || event.type === "voice.leave") {
        if (typeof event.channelId !== "string" || event.channelId.length > 80)
          return;
        const channel = database.channels.find(
          (item) => item.id === event.channelId && item.type === "voice",
        );
        if (
          !channel ||
          !serverForUser(
            database.users.find((user) => user.id === userId),
            channel.serverId,
          )
        )
          return;
        if (!voiceRooms.has(channel.id)) voiceRooms.set(channel.id, new Map());
        const caller = database.users.find((item) => item.id === userId);
        const membership = membershipFor(caller, channel.serverId);
        if (event.type === "voice.join" && (!hasServerPermission(caller, database.servers.find((item) => item.id === channel.serverId), "connectVoice") || membership?.voiceMuted)) {
          socket.send(JSON.stringify({ type: "voice.denied", channelId: channel.id, reason: membership?.voiceMuted ? "Você está silenciado na voz deste servidor." : "Seu cargo não pode entrar em canais de voz." }));
          return;
        }
        const room = voiceRooms.get(channel.id);
        const wasPresent = room.has(userId);
        const changing = event.type === "voice.join" ? !wasPresent : wasPresent;
        if (event.type === "voice.join")
          room.set(userId, { camera: false, screen: false });
        else room.delete(userId);
        if (changing) {
          broadcastVoice(channel.id, {
            type: "voice.participants",
            channelId: channel.id,
            participants: voiceParticipants(channel.id),
          });
          broadcastVoiceState(channel);
        }
        if (event.type === "voice.leave" && room.size === 0)
          voiceRooms.delete(channel.id);
      } else if (event.type === "voice.media") {
        if (typeof event.channelId !== "string" || event.channelId.length > 80)
          return;
        const channel = database.channels.find(
          (item) => item.id === event.channelId && item.type === "voice",
        );
        const room = channel && voiceRooms.get(channel.id);
        const caller = database.users.find((item) => item.id === userId);
        const voiceServer = channel && database.servers.find((item) => item.id === channel.serverId);
        if (!room?.has(userId) || !caller || !voiceServer) return;
        if (event.camera && !hasServerPermission(caller, voiceServer, "useCamera"))
          return socket.send(JSON.stringify({ type: "voice.media.denied", channelId: channel.id, reason: "Seu cargo não pode usar câmera neste servidor." }));
        if (event.screen && !hasServerPermission(caller, voiceServer, "shareScreen"))
          return socket.send(JSON.stringify({ type: "voice.media.denied", channelId: channel.id, reason: "Seu cargo não pode compartilhar tela neste servidor." }));
        room.set(userId, {
          camera: Boolean(event.camera),
          screen: Boolean(event.screen),
        });
        broadcastVoice(channel.id, {
          type: "voice.participants",
          channelId: channel.id,
          participants: voiceParticipants(channel.id),
        });
        broadcastVoiceState(channel);
      } else if (
        ["voice.offer", "voice.answer", "voice.ice"].includes(event.type)
      ) {
        if (!validRealtimeRelay(event) || event.targetUserId === userId) return;
        const sharedRoom = [...voiceRooms.values()].some(
          (room) => room.has(userId) && room.has(event.targetUserId),
        );
        if (!sharedRoom) return;
        const target = sockets.get(event.targetUserId);
        if (target?.readyState === 1)
          target.send(
            JSON.stringify({
              type: event.type,
              targetUserId: event.targetUserId,
              fromUserId: userId,
              ...(event.type === "voice.offer" ? { offer: event.offer } : {}),
              ...(event.type === "voice.answer" ? { answer: event.answer } : {}),
              ...(event.type === "voice.ice"
                ? { candidate: event.candidate }
                : {}),
            }),
          );
      }
    } catch {
      /* ignore malformed realtime events */
    }
  });
  socket.on("close", () => {
    if (sockets.get(userId) !== socket) return;
    sockets.delete(userId);
    for (const [channelId, room] of voiceRooms)
      if (room.delete(userId)) {
        const channel = database.channels.find((item) => item.id === channelId);
        if (channel) broadcastVoiceState(channel);
        if (!room.size) voiceRooms.delete(channelId);
      }
    const departed = database.users.find((item) => item.id === userId);
    if (departed)
      broadcastAll({
        type: "presence.updated",
        userId,
        presence: presenceOf(departed),
      });
  });
});
const websocketHeartbeat = setInterval(() => {
  for (const socket of wss.clients) {
    if (socket.isAlive === false) {
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }
}, 30_000);
websocketHeartbeat.unref?.();
server.on("close", () => clearInterval(websocketHeartbeat));
server.on("error", (error) => {
  if (error.code === "EADDRINUSE")
    console.error(
      `A porta ${port} já está em uso. O Sesh continuará usando o servidor existente.`,
    );
  else throw error;
});
wss.on("error", (error) => {
  if (error.code !== "EADDRINUSE") console.error(error);
});
server.listen(port, host, () =>
  console.log(`Sesh API em http://${host}:${port}`),
);
export { server };
