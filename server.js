import http from "node:http";
import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { GAME_CATALOG, GAME_IDS } from "./game-catalog.js";
import { PROFILE_EFFECTS, AVATAR_FRAMES, PROFILE_OVERLAYS, PREMIUM_AVATAR_FRAMES, PREMIUM_PROFILE_OVERLAYS, PREMIUM_BANNER_PRESETS, NAME_EFFECTS } from "./cosmetics.js";
import { classifyImagePrompt, generateImage, parseImageCommand } from "./image-generation.js";
import { NAMEPLATE_IDS } from "./nameplates.js";
import { PROFILE_ART_IDS } from "./profile-art.js";
import { PROFILE_FRAME_IDS } from "./profile-frames.js";

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
const MESSAGE_RETENTION_DAYS = Math.max(0, Math.min(Number(process.env.MESSAGE_RETENTION_DAYS) || 0, 3650));
const COLLECTIONS = [
  "users",
  "servers",
  "channels",
  "messages",
  "messageReports",
  "memberships",
  "adminCatalog",
  "subscriptions",
  "friendships",
  "emailVerifications",
  "directMessages",
  "directGroups",
  "sessions",
];
const sessions = new Map();
const wsTickets = new Map();
const loginAttempts = new Map();
const sockets = new Map();
const voiceRooms = new Map();
const privateCalls = new Map();
const imageGenerationUsage = new Map();
const profileMediaUrls = new Map();
const AI_IMAGE_DAILY_LIMIT = Math.max(1, Math.min(Number(process.env.AI_IMAGE_DAILY_LIMIT) || 5, 50));
const AI_SESH_USER = Object.freeze({
  id: "ai-sesh",
  publicId: "S-IASESH0000",
  username: "ia_sesh",
  tag: "0000",
  displayName: "IA SESH",
  createdAt: null,
  avatarColor: "purple",
  avatar: "/ai-sesh-avatar.png",
  banner: null,
  badges: ["verificado"],
  status: "online",
  nameStyle: "default",
  nameColor: "#a99cff",
  nameEffect: "glow",
  avatarFrame: "none",
});
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
const SHORT_USERNAME_EMAILS = new Set(
  String(process.env.SHORT_USERNAME_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);
const SHORT_USERNAME_EMAIL_HASHES = new Set([
  // Exact production exception stored as SHA-256 so the address is not published.
  "10207282f8a43d267b457523f7e1b3d2362a2ec574772540e1a073595a5ce2f0",
]);
const SHORT_USERNAME_ASSIGNMENTS = new Map([
  // Exact account exception stored as SHA-256 so the address is not published.
  ["0f3d49993657c7eb8c61dc56f1a5d064f121e4247e8f2450a3d79a7b7febc190", "nt"],
]);
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
const ROLE_STYLES = [
  "solid", "glow", "pulse", "blink", "dark_wave",
  "rgb", "gradient", "shimmer", "neon", "electric",
];
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
      emoji: (() => {
        const emoji = String(role.emoji || "").trim();
        return emoji && emoji.length <= 32 && [...emoji].length <= 16 && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(emoji) ? emoji : "";
      })(),
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
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function pgQueryWithRetry(text, params = [], attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await pgClient.query(text, params);
    } catch (error) {
      lastError = error;
      if (attempt + 1 >= attempts) break;
      console.warn(`PostgreSQL indisponível; nova tentativa ${attempt + 2}/${attempts}.`);
      await wait(250 * 2 ** attempt);
    }
  }
  throw lastError;
}
function messageRetentionHash(message) {
  return crypto.createHash("sha256").update(JSON.stringify({
    id: message.id,
    channelId: message.channelId,
    authorId: message.authorId,
    content: message.content || "",
    attachment: message.attachment || null,
    createdAt: message.createdAt,
  })).digest("hex");
}
function expireOldServerMessages() {
  if (!MESSAGE_RETENTION_DAYS) return 0;
  const cutoff = Date.now() - MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const expiredAt = now();
  let expired = 0;
  database.messages = database.messages.map((message) => {
    const createdAt = Date.parse(message.createdAt);
    if (message.expiredAt || message.pinnedAt || !Number.isFinite(createdAt) || createdAt >= cutoff) return message;
    expired++;
    return {
      id: message.id,
      channelId: message.channelId,
      authorId: message.authorId,
      createdAt: message.createdAt,
      expiredAt,
      messageHash: messageRetentionHash(message),
    };
  });
  if (expired) console.log(`Sesh: ${expired} mensagem(ns) de canal expirada(s); conteúdo substituído por hash SHA-256.`);
  return expired;
}
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
function generatedPublicId(user, nonce = 0) {
  if (isPrimaryMasterAdmin(user) && nonce === 0) return "S-0000000001";
  return "S-" + crypto.createHash("sha256")
    .update(`${user?.id || user?.email || user?.username || "sesh"}:${nonce}`)
    .digest("hex").slice(0, 10).toUpperCase();
}
function allocatePublicId(user) {
  let nonce = 0;
  let candidate;
  do candidate = generatedPublicId(user, nonce++);
  while (database?.users?.some((item) => item !== user && item.publicId === candidate));
  return candidate;
}
function minimumUsernameLengthFor(user, requestedUsername = user?.username) {
  if (isPrimaryMasterAdmin(user) || user?.shortUsernameAllowed === true) return 1;
  const currentUsername = String(user?.username || "").trim().toLowerCase();
  const normalizedUsername = String(requestedUsername || "").trim().toLowerCase();
  if (currentUsername.length >= 2 && currentUsername.length < 4 && normalizedUsername === currentUsername) return currentUsername.length;
  const email = String(user?.email || "").trim().toLowerCase();
  const emailHash = crypto.createHash("sha256").update(email).digest("hex");
  if (SHORT_USERNAME_ASSIGNMENTS.get(emailHash) === normalizedUsername) return normalizedUsername.length;
  return SHORT_USERNAME_EMAILS.has(email) || SHORT_USERNAME_EMAIL_HASHES.has(emailHash) ? 3 : 4;
}
function canUseShortUsername(user) {
  return minimumUsernameLengthFor(user) < 4;
}
const blankDatabase = () =>
  Object.fromEntries(COLLECTIONS.map((key) => [key, []]));
const normalizeDatabase = (input) => {
  const normalized = Object.fromEntries(
    COLLECTIONS.map((key) => [
      key,
      Array.isArray(input?.[key]) ? input[key] : [],
    ]),
  );
  const usedPublicIds = new Set();
  normalized.users = normalized.users.map((user) => {
    let publicId = !isPrimaryMasterAdmin(user) && /^S-[A-F0-9]{10}$/.test(String(user.publicId || "").toUpperCase()) && String(user.publicId).toUpperCase() !== "S-0000000001"
      ? String(user.publicId).toUpperCase()
      : generatedPublicId(user);
    let nonce = 1;
    while (usedPublicIds.has(publicId)) publicId = generatedPublicId(user, nonce++);
    usedPublicIds.add(publicId);
    return {
    ...user, publicId,
    shortUsernameAllowed: user.shortUsernameAllowed === true || String(user.username || "").toLowerCase() === "s",
    badges: [
      ...new Set(
        (Array.isArray(user.badges) ? user.badges : [])
          .map((badge) => LEGACY_BADGES[badge] || badge)
          .filter((badge) => ALLOWED_BADGES.includes(badge)),
      ),
    ],
    avatarFrame: AVATAR_FRAMES.some(([value]) => value === user.avatarFrame) ? user.avatarFrame : "none",
    favoriteGame: user.favoriteGame || "",
    activityText: user.activityText || "",
    wishlist: user.wishlist || "",
    emailVerifiedAt: user.emailVerifiedAt === undefined ? now() : user.emailVerifiedAt,
  };});
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
    // Old builds could toggle these flags from a broken context menu without audit metadata.
    textMuted: Boolean(membership.textMuted && membership.textMutedAt),
    voiceMuted: Boolean(membership.voiceMuted && membership.voiceMutedAt),
    textMutedAt: membership.textMuted && membership.textMutedAt ? membership.textMutedAt : null,
    textMutedBy: membership.textMuted && membership.textMutedAt ? membership.textMutedBy || null : null,
    voiceMutedAt: membership.voiceMuted && membership.voiceMutedAt ? membership.voiceMutedAt : null,
    voiceMutedBy: membership.voiceMuted && membership.voiceMutedAt ? membership.voiceMutedBy || null : null,
  }));
  normalized.sessions = normalized.sessions
    .filter((record) => record?.tokenHash && record?.userId && Number(record.expiresAt) > Date.now())
    .slice(-5000);
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
    pgClient = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
    });
    pgClient.on("error", (error) => {
      // Pools discard broken idle connections. Logging the event prevents a
      // transient database disconnect from becoming an uncaught process crash.
      console.error("Conexão PostgreSQL ociosa foi descartada:", error.message);
    });
    pgClient.on("connect", (client) => {
      // Keep a listener attached to every physical client. pg-pool temporarily
      // swaps its own idle listener while checking connections in and out; a
      // second socket error in that transition must not become unhandled.
      client.on("error", (error) => {
        console.error("Conexão PostgreSQL interna foi descartada:", error.message);
      });
    });
    await pgQueryWithRetry(
      "CREATE TABLE IF NOT EXISTS app_state (key text primary key, value jsonb not null)",
    );
    await pgQueryWithRetry(
      "CREATE TABLE IF NOT EXISTS avatar_decorations (id text primary key, content_type text not null default 'image/png', bytes bytea not null, updated_at timestamptz not null default now())",
    );
    const { rows } = await pgQueryWithRetry("SELECT key, value FROM app_state");
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
  if (MASTER_ADMIN_EMAIL && MASTER_ADMIN_PASSWORD.length >= 10) {
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
    if (!user.publicId) user.publicId = allocatePublicId(user);
    const badges = Array.isArray(user.badges) ? user.badges : [];
    user.badges = isCreator(user)
      ? [...new Set([...badges, "criador"])]
      : badges.filter((badge) => badge !== "criador");
  }
  // No PostgreSQL, o restante do estado acabou de ser lido e não precisa ser
  // serializado novamente. Persistir só usuários evita duplicar em memória
  // históricos e anexos grandes durante cada inicialização.
  if (pgClient) await saveDatabase("users");
  else await saveDatabase();
  console.log(
    `Sesh: ${database.users.length} usuário(s) carregados do armazenamento ${DATABASE_URL ? "PostgreSQL" : "local"}.`,
  );
}
async function persistDatabase(keys = null) {
  // No caminho PG grava só as coleções sujas (padrão: tudo). No arquivo
  // local a regravaçao é integral, mas sem structuredClone: JSON.stringify
  // é síncrono (atômico na thread), então o clone profundo de MBs de
  // base64 era custo puro a cada mensagem.
  const expiredMessages = expireOldServerMessages();
  if (pgClient) {
    const targets = Array.isArray(keys) && keys.length
      ? [...new Set(keys.filter((key) => COLLECTIONS.includes(key)))]
      : [...COLLECTIONS];
    if (expiredMessages && !targets.includes("messages")) targets.push("messages");
    if (!targets.length) return;
    const params = [];
    const rows = targets.map((key, index) => {
      params.push(key, JSON.stringify(database[key] || []));
      return `($${2 * index + 1}, $${2 * index + 2}::jsonb)`;
    });
    let lastError;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let transaction;
      let discardConnection = false;
      try {
        transaction = await pgClient.connect();
        await transaction.query("BEGIN");
        await transaction.query(
          `INSERT INTO app_state (key, value) VALUES ${rows.join(",")} ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          params,
        );
        await transaction.query("COMMIT");
        return;
      } catch (error) {
        lastError = error;
        discardConnection = true;
        if (transaction) {
          try { await transaction.query("ROLLBACK"); } catch { /* connection already gone */ }
        }
        if (attempt + 1 >= 4) break;
        console.warn(`Gravação PostgreSQL interrompida; nova tentativa ${attempt + 2}/4.`);
        await wait(250 * 2 ** attempt);
      } finally {
        transaction?.release(discardConnection);
      }
    }
    throw lastError;
  }
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(`${dataFile}.tmp`, encodeDatabase(database), "utf8");
  await fs.rename(`${dataFile}.tmp`, dataFile);
}
// Agrupa mutações que chegam enquanto uma gravação já está em andamento.
// Sem isso, cada mensagem aguardava uma gravação completa do estado inteiro
// atrás de todas as anteriores — um gargalo perceptível no chat.
// saveDatabase("messages") restringe (no PG) às coleções sujas.
let saveInProgress = false;
let saveRequested = false;
let pendingKeys = [];
function saveDatabase(...keys) {
  if (!keys.length) pendingKeys = null;
  else if (pendingKeys !== null) pendingKeys = [...new Set([...pendingKeys, ...keys])];
  saveRequested = true;
  if (saveInProgress) return saveQueue;

  saveInProgress = true;
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    while (saveRequested) {
      saveRequested = false;
      const batch = pendingKeys;
      pendingKeys = [];
      await persistDatabase(batch);
    }
  }).finally(() => {
    saveInProgress = false;
  });
  return saveQueue;
}
// Histórico leve: com ?attachments=refs a listagem troca o anexo (base64 de
// até 3 MB por mensagem!) por um descritor; o cliente busca o conteúdo sob
// demanda. Sem o parâmetro, comportamento antigo (compatibilidade).
function attachmentRef(message) {
  const attachment = message.attachment;
  if (!attachment) return null;
  if (typeof attachment === "string") return { ref: true, kind: "image" };
  return { ref: true, kind: "file", name: attachment.name, size: attachment.size };
}
function stripAttachments(message) {
  if (!message.attachment) return message;
  return { ...message, attachment: attachmentRef(message) };
}
function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Origin-Agent-Cluster": "?1",
    "Permissions-Policy":
      "camera=(self), microphone=(self), display-capture=(self), geolocation=()",
    "Content-Security-Policy":
      "default-src 'self'; img-src 'self' data: https:; media-src 'self' blob:; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    ...(isProduction
      ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" }
      : {}),
  };
}
// AUTH_SECURITY: respostas JSON nunca entram em cache e, em produção,
// reforçam o isolamento entre documentos/janelas (COOP/CORP acima).
// Aceita json(res, status, payload) e json(req, res, status, payload).
function json(a, b, c, d, e = {}) {
  let req = null;
  let res;
  let status;
  let payload;
  let extraHeaders;
  if (a && typeof a.writeHead === "function") {
    res = a;
    status = b;
    payload = c;
    extraHeaders = d || {};
  } else {
    req = a;
    res = b;
    status = c;
    payload = d;
    extraHeaders = e || {};
  }
  const headers = {
    ...securityHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Cache-Control": "no-store",
    ...extraHeaders,
  };
  if (CORS_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = CORS_ORIGIN;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  res.writeHead(status, headers);
  // HEAD não deve retornar corpo.
  if (req?.method === "HEAD") return res.end();
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
function userMediaUrl(user, field, value) {
  if (typeof value !== "string" || !/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(value)) return value;
  const key = `${user.id}:${field}`;
  const cached = profileMediaUrls.get(key);
  if (cached?.value === value) return cached.url;
  const version = crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
  const url = `/api/users/${encodeURIComponent(user.id)}/media/${field}?v=${version}`;
  profileMediaUrls.set(key, { value, url });
  return url;
}
function publicProfileMedia(user, field) {
  return userMediaUrl(user, field, user?.[field] || null);
}
function privatePreferenceMedia(user, field) {
  return userMediaUrl(user, field, user?.preferences?.[field] || null);
}
function profileMediaPayload(value) {
  const match = typeof value === "string"
    ? value.match(/^data:image\/(png|jpeg|gif|webp);base64,([a-z0-9+/=]+)$/i)
    : null;
  if (!match) return null;
  return {
    contentType: `image/${match[1].toLowerCase()}`,
    bytes: Buffer.from(match[2], "base64"),
  };
}

function parseSingleByteRange(header, size) {
  if (!header) return null;
  const match = String(header).match(/^bytes=(\d*)-(\d*)$/i);
  if (!match || size <= 0) return false;
  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return false;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start)
      return false;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}
function publicUser(user) {
  const publicBadges = badgesForUser(user);
  return {
    id: user.id,
    publicId: user.publicId || generatedPublicId(user),
    username: user.username,
    tag: userTag(user),
    // Values created before the current validation are also made harmless here.
    displayName: safeDisplayName(user.displayName, user.username),
    createdAt: user.createdAt || null,
    avatarColor: user.avatarColor,
    avatar: publicProfileMedia(user, "avatar"),
    banner: publicProfileMedia(user, "banner"),
    bannerPreset: user.bannerPreset || "aurora",
    bannerPositionX: user.bannerPositionX ?? 50,
    bannerPositionY: user.bannerPositionY ?? 50,
    effectIntensity: user.effectIntensity || "balanced",
    effectSpeed: user.effectSpeed || "normal",
    profileOverlay: PROFILE_OVERLAYS.some(([value]) => value === user.profileOverlay) ? user.profileOverlay : "none",
    profilePrimaryColor: user.profilePrimaryColor || null,
    profileAccentColor: user.profileAccentColor || null,
    bio: user.bio || "",
    badges: publicBadges,
    status: user.status || "online",
    nameStyle: user.nameStyle || "default",
    nameColor: user.nameColor || "#f1f3f5",
    nameEffect: user.nameEffect || "solid",
    profileTheme: user.profileTheme || "default",
    profilePlate: user.profilePlate || "default",
    profileArtEffect: publicBadges.includes("nitro_classic") && PROFILE_ART_IDS.has(user.profileArtEffect) ? user.profileArtEffect : "none",
    profileFrame: publicBadges.includes("nitro_classic") && PROFILE_FRAME_IDS.has(user.profileFrame) ? user.profileFrame : "none",
    profileEffect: user.profileEffect || "none",
    avatarFrame: AVATAR_FRAMES.some(([value]) => value === user.avatarFrame) ? user.avatarFrame : "none",
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
function canManageBadges(user) {
  return isCreator(user);
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
  await saveDatabase("emailVerifications");
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
  const preferences = {
    ...(user.preferences || {}),
    appBackground: privatePreferenceMedia(user, "appBackground"),
  };
  return {
    ...publicUser(user),
    // Até a própria conta usa URLs curtas. Reenviar vários MB de base64 no
    // login e em /auth/me causava picos de heap sob acessos simultâneos.
    avatar: publicProfileMedia(user, "avatar"),
    banner: publicProfileMedia(user, "banner"),
    email: user.email || "",
    emailVerified: Boolean(user.emailVerifiedAt),
    isCreator: isCreator(user),
    isMasterAdmin: isMasterAdmin(user),
    canUseShortUsername: canUseShortUsername(user),
    minimumUsernameLength: minimumUsernameLengthFor(user),
    preferences,
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
// Client IP atrás de Cloudflare/Render: confia nos cabeçalhos do proxy.
// Sem isso, req.socket.remoteAddress é o IP interno do roteador e o
// rate-limit por IP nunca distingue (nem protege) clientes reais.
function clientIp(req) {
  const connecting = String(req.headers["cf-connecting-ip"] || "").trim();
  if (connecting) return connecting.split(",")[0].trim();
  const forwarded = String(req.headers["x-forwarded-for"] || "").trim();
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60_000;
const REGISTER_MAX_PER_HOUR = Math.max(1, Number(process.env.REGISTER_MAX_PER_HOUR) || 10);
const registerAttempts = new Map(); // ip -> { count, resetAt }
function loginLimitKey(req, identifier) {
  return clientIp(req) + ":" + String(identifier || "").toLowerCase();
}
function loginRetryAfterMs(req, identifier) {
  const current = loginAttempts.get(loginLimitKey(req, identifier));
  if (!current || current.resetAt <= Date.now()) return 0;
  if (current.count < LOGIN_MAX_ATTEMPTS) return 0;
  return Math.max(0, current.resetAt - Date.now());
}
function loginBlocked(req, identifier) {
  return loginRetryAfterMs(req, identifier) > 0;
}
function recordLoginFailure(req, identifier) {
  const key = loginLimitKey(req, identifier);
  const current = loginAttempts.get(key);
  loginAttempts.set(key, {
    count: current?.resetAt > Date.now() ? current.count + 1 : 1,
    resetAt: current?.resetAt > Date.now()
      ? current.resetAt
      : Date.now() + LOGIN_LOCKOUT_MS,
  });
}
function registerBlocked(req) {
  const key = clientIp(req);
  const current = registerAttempts.get(key);
  if (!current || current.resetAt <= Date.now()) {
    registerAttempts.delete(key);
    return false;
  }
  return current.count >= REGISTER_MAX_PER_HOUR;
}
function recordRegisterAttempt(req) {
  const key = clientIp(req);
  const current = registerAttempts.get(key);
  registerAttempts.set(key, {
    count: current?.resetAt > Date.now() ? current.count + 1 : 1,
    resetAt: current?.resetAt > Date.now()
      ? current.resetAt
      : Date.now() + 60 * 60_000,
  });
}
function rateLimitHeaders(ms) {
  return {
    "Retry-After": String(Math.ceil(ms / 1000)),
    "X-Content-Type-Options": "nosniff",
  };
}
// Política de senha: mínimo 10 / máximo 128, sem senhas notoriamente fracas.
const COMMON_PASSWORDS = new Set([
  "123456", "12345678", "123456789", "1234567890", "12345", "1234567",
  "qwerty", "abc123", "password", "password1", "123123", "000000",
  "654321", "senha", "senha123", "sesh", "demo123", "teste123",
]);
function passwordError(password, { username = "", email = "" } = {}) {
  if (typeof password !== "string") return "A senha precisa ter pelo menos 10 caracteres.";
  if (password.length < 10) return "A senha precisa ter pelo menos 10 caracteres.";
  if (password.length > 128) return "A senha deve ter no máximo 128 caracteres.";
  const lowered = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowered)) return "Essa senha é muito comum. Escolha outra senha.";
  const name = String(username || "").toLowerCase();
  const mailUser = String(email || "").toLowerCase().split("@")[0];
  if (name && name.length >= 3 && lowered.includes(name)) return "A senha não pode conter seu nome de usuário.";
  if (mailUser && mailUser.length >= 3 && lowered.includes(mailUser)) return "A senha não pode conter seu e-mail.";
  return null;
}
function acceptedFriends(firstUserId, secondUserId) {
  return database.friendships.some(
    (item) =>
      item.status === "accepted" &&
      [item.requesterId, item.addresseeId].includes(firstUserId) &&
      [item.requesterId, item.addresseeId].includes(secondUserId),
  );
}
function privateCallForChannel(channelId) {
  if (!String(channelId || "").startsWith("private:")) return null;
  const call = privateCalls.get(String(channelId).slice("private:".length));
  if (!call || Date.now() - call.createdAt > 2 * 60 * 60 * 1000) return null;
  return call;
}
function privateCallView(call, viewerId = call.creatorId) {
  const participants = call.participantIds
    .map((userId) => publicUser(database.users.find((item) => item.id === userId)))
    .filter(Boolean);
  const others = participants.filter((person) => person.id !== viewerId);
  return {
    id: call.id,
    channelId: `private:${call.id}`,
    name: call.name ? `Call · ${call.name}` : others.length > 1
      ? `Call com ${others.slice(0, 2).map((person) => person.displayName).join(", ")}${others.length > 2 ? ` +${others.length - 2}` : ""}`
      : `Call com ${others[0]?.displayName || "amigo"}`,
    creatorId: call.creatorId,
    participants,
    createdAt: new Date(call.createdAt).toISOString(),
  };
}
function directGroupView(group) {
  const members = group.memberIds
    .map((userId) => publicUser(database.users.find((item) => item.id === userId)))
    .filter(Boolean);
  const lastMessage = group.messages?.at(-1);
  return {
    id: group.id,
    name: group.name,
    ownerId: group.ownerId,
    members,
    createdAt: group.createdAt,
    updatedAt: lastMessage?.createdAt || group.createdAt,
    lastMessage: lastMessage ? decorateMessage(lastMessage) : null,
  };
}
function decodeDisplayNameMarkup(value) {
  let decoded = String(value || "");
  for (let pass = 0; pass < 3; pass += 1) {
    const next = decoded
      .replace(/&amp;/gi, "&")
      .replace(/&lt;|&#0*60;|&#x0*3c;/gi, "<")
      .replace(/&gt;|&#0*62;|&#x0*3e;/gi, ">");
    if (next === decoded) break;
    decoded = next;
  }
  return decoded.replace(/%3c/gi, "<").replace(/%3e/gi, ">");
}
function displayNameError(value) {
  if (typeof value !== "string" || !value.trim()) return "Nome de exibição é obrigatório.";
  if (value.trim().length > 80) return "O nome de exibição deve ter no máximo 80 caracteres.";
  if (/[<>]/.test(decodeDisplayNameMarkup(value)) || /[\u0000-\u001f\u007f]/.test(value))
    return "Nome de exibição inválido: não use tags ou caracteres de controle.";
  return null;
}
function safeDisplayName(value, fallback = "Usuário") {
  const raw = String(value || "");
  const safeFallback = String(fallback || "Usuário").trim().slice(0, 80) || "Usuário";
  // If markup was ever stored (plain, entity-encoded or URL-encoded), discard
  // the whole legacy display name instead of leaving prefixes such as "##".
  if (/[<>]/.test(decodeDisplayNameMarkup(raw))) return safeFallback;
  const cleaned = raw
    .replace(/<[^>]*>/g, "")
    .replace(/[<>\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || safeFallback;
}
const sessionHash = (token) => crypto.createHash("sha256").update(token).digest("hex");
async function createSession(userId, collections = ["sessions"]) {
  const token = id();
  const tokenHash = sessionHash(token);
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessions.set(token, userId);
  database.sessions = database.sessions.filter((record) => Number(record.expiresAt) > Date.now()).slice(-4999);
  database.sessions.push({ tokenHash, userId, expiresAt, createdAt: now() });
  await saveDatabase(...collections);
  return token;
}
async function revokeSession(token) {
  sessions.delete(token);
  const tokenHash = sessionHash(token);
  database.sessions = database.sessions.filter((record) => record.tokenHash !== tokenHash);
  await saveDatabase("sessions");
}
function getUser(req) {
  const token = sessionToken(req);
  if (!token) return undefined;
  let userId = sessions.get(token);
  if (!userId) {
    const record = database.sessions.find((item) => item.tokenHash === sessionHash(token) && Number(item.expiresAt) > Date.now());
    userId = record?.userId;
    if (userId) sessions.set(token, userId);
  }
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
function reserveImageGeneration(userId) {
  const day = new Date().toISOString().slice(0, 10);
  for (const key of imageGenerationUsage.keys())
    if (!key.startsWith(day + ":")) imageGenerationUsage.delete(key);
  const key = `${day}:${userId}`;
  const used = imageGenerationUsage.get(key) || 0;
  if (used >= AI_IMAGE_DAILY_LIMIT) {
    const error = new Error(`Você atingiu o limite diário de ${AI_IMAGE_DAILY_LIMIT} imagens.`);
    error.status = 429;
    throw error;
  }
  imageGenerationUsage.set(key, used + 1);
  let reserved = true;
  return () => {
    if (!reserved) return;
    reserved = false;
    const current = imageGenerationUsage.get(key) || 1;
    if (current <= 1) imageGenerationUsage.delete(key);
    else imageGenerationUsage.set(key, current - 1);
  };
}
function decorateMessage(message) {
  const visibleMessage = message.expiredAt
    ? { ...message, content: "Mensagem expirada", attachment: null, expired: true }
    : message;
  const user = database.users.find((item) => item.id === message.authorId);
  const reply = message.replyToId
    ? database.messages.find((item) => item.id === message.replyToId && item.channelId === message.channelId)
    : null;
  const forwardedAuthor = message.forwardedFrom?.authorId
    ? database.users.find((item) => item.id === message.forwardedFrom.authorId)
    : null;
  return {
    ...visibleMessage,
    author: publicUser(user),
    reactions: (Array.isArray(message.reactions) ? message.reactions : [])
      .filter((reaction) => reaction?.emoji && Array.isArray(reaction.userIds) && reaction.userIds.length)
      .map((reaction) => ({
        emoji: reaction.emoji,
        userIds: [...new Set(reaction.userIds)],
        count: new Set(reaction.userIds).size,
      })),
    replyTo: reply
      ? {
          id: reply.id,
          content: reply.expiredAt ? "Mensagem expirada" : String(reply.content || "").slice(0, 180),
          hasAttachment: Boolean(reply.attachment),
          author: publicUser(database.users.find((item) => item.id === reply.authorId)),
        }
      : null,
    forwardedFrom: message.forwardedFrom
      ? {
          ...message.forwardedFrom,
          author: publicUser(forwardedAuthor),
        }
      : null,
  };
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
            muted: Boolean(media?.muted),
            deafened: Boolean(media?.deafened),
            camera: Boolean(media?.camera),
            screen: Boolean(media?.screen),
            relayAudio: Boolean(media?.relayAudio),
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
    // Liveness probe: sem detalhes de versão/stack (evita fingerprinting).
    // GET e HEAD explícitos; qualquer outro método recebe 405.
    if (url.pathname === "/api/health") {
      if (req.method !== "GET" && req.method !== "HEAD")
        return json(req, res, 405, { error: "Método não permitido." }, { Allow: "GET" });
      if (req.method === "GET" && pgClient) await pgQueryWithRetry("SELECT 1", [], 2);
      return json(req, res, 200, { ok: true });
    }
    const decorationMatch = url.pathname.match(/^\/api\/avatar-decorations\/([a-z0-9_]+)\.png$/i);
    if (decorationMatch) {
      if (req.method !== "GET" && req.method !== "HEAD")
        return json(req, res, 405, { error: "Método não permitido." }, { Allow: "GET, HEAD" });
      if (!pgClient) return json(req, res, 404, { error: "Moldura não encontrada." });
      const { rows } = await pgClient.query(
        "SELECT content_type, bytes FROM avatar_decorations WHERE id = $1",
        [decorationMatch[1]],
      );
      if (!rows[0]) return json(req, res, 404, { error: "Moldura não encontrada." });
      res.writeHead(200, { ...securityHeaders(), "Content-Type": rows[0].content_type, "Cache-Control": "public, max-age=31536000, immutable" });
      return req.method === "HEAD" ? res.end() : res.end(rows[0].bytes);
    }
    // Higiene: arquivos de descoberta e segurança com respostas próprias,
    // nunca o fallback da SPA.
    if (url.pathname === "/.well-known/security.txt" && (req.method === "GET" || req.method === "HEAD")) {
      const contact = RESEND_FROM_EMAIL || "https://github.com/minatinint-wq/projetodiscord";
      const txt = `Contact: mailto:${contact}\nExpires: 2027-12-31T23:59:59.000Z\nPreferred-Languages: pt-BR, en\n`;
      res.writeHead(200, { ...securityHeaders(), "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" });
      if (req.method === "HEAD") return res.end();
      return res.end(txt);
    }
    if (url.pathname === "/robots.txt" && (req.method === "GET" || req.method === "HEAD")) {
      const txt = "User-agent: *\nDisallow: /api/\nDisallow: /admin\n";
      res.writeHead(200, { ...securityHeaders(), "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" });
      if (req.method === "HEAD") return res.end();
      return res.end(txt);
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
      await saveDatabase("users", "emailVerifications");
      res.writeHead(302, { Location: "/app?email_verified=1" });
      return res.end();
    }
    if (url.pathname === "/api/auth/register" && req.method === "POST") {
      if (registerBlocked(req))
        return json(req, res, 429, {
          error: "Muitas contas criadas desta rede. Aguarde uma hora e tente novamente.",
        }, rateLimitHeaders(60 * 60_000));
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
      if (!username)
        return json(res, 400, {
          error: "Usuário é obrigatório.",
        });
      const invalidDisplayName = displayNameError(displayName);
      if (invalidDisplayName) return json(res, 400, { error: invalidDisplayName });
      const passError = passwordError(input.password, { username, email });
      if (passError) return json(res, 400, { error: passError });
      const minimumUsernameLength = minimumUsernameLengthFor({ email }, username);
      if (!new RegExp(`^[a-z0-9_.-]{${minimumUsernameLength},20}$`).test(username))
        return json(res, 400, {
          error:
            `Usuário inválido: use de ${minimumUsernameLength} a 20 caracteres (letras, números, ponto, hífen ou underline), sem espaços.`,
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
      user.publicId = allocatePublicId(user);
      database.users.push(user);
      recordRegisterAttempt(req);
      const session = await createSession(user.id, ["users", "sessions"]);
      setSessionCookie(res, session);
      // Registration must never wait for an external email provider.
      // Sessão via cookie httpOnly; o token não volta no corpo (anti-XSS).
      return json(res, 201, { user: sessionUser(user), verificationRequired: false, verificationEmailSent: false });
    }
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      const input = await body(req);
      const rawIdentifier = String(input.username || input.email || "").trim().toLowerCase();
      const handle = rawIdentifier.match(/^@?([a-z0-9_.-]{1,20})(?:#(\d{4}))?$/);
      const identifier = handle ? handle[1] : rawIdentifier;
      const suppliedTag = handle?.[2];
      if (loginBlocked(req, identifier)) {
        const retryMs = loginRetryAfterMs(req, identifier);
        return json(req, res, 429, {
          error: "Muitas tentativas. Aguarde 15 minutos e tente novamente.",
        }, rateLimitHeaders(retryMs));
      }
      const user = database.users.find(
        (item) =>
          (String(item.username).toLowerCase() === identifier && (!suppliedTag || userTag(item) === suppliedTag)) ||
          String(item.publicId || "").toUpperCase() === rawIdentifier.toUpperCase() ||
          (item.email || "").toLowerCase() === identifier,
      );
      if (!user || !verifyPassword(input.password || "", user.password)) {
        recordLoginFailure(req, identifier);
        return json(res, 401, { error: "Usuário ou senha incorretos. Entre com @usuário, ID público ou e-mail de cadastro (não o nome de exibição)." });
      }
      loginAttempts.delete(loginLimitKey(req, identifier));
      const loginSession = await createSession(user.id);
      setSessionCookie(res, loginSession);
      // Sessão via cookie httpOnly; sem token no corpo (anti-XSS).
      // O cabeçalho Authorization continua aceito na leitura para
      // compatibilidade com clientes antigos.
      return json(res, 200, { user: sessionUser(user) });
    }
    // Arquivos estáticos + fallback da SPA (GET e HEAD).
    // Dotfiles e sondas sensíveis (/.git, /.env, ...) recebem 404 e
    // nunca o index.html — evita mascarar scanner e vazar existência.
    if ((req.method === "GET" || req.method === "HEAD") && !url.pathname.startsWith("/api/")) {
      // Links copiados de mensagens às vezes absorvem o ponto final da frase.
      // Corrija apenas a rota conhecida do app; não normalize caminhos de arquivos.
      if (url.pathname === "/app.") {
        res.writeHead(308, {
          ...securityHeaders(),
          Location: `/app${url.search}`,
          "Cache-Control": "no-store",
        });
        return res.end();
      }
      const lower = url.pathname.toLowerCase();
      const sensitive = lower === "/.env" || lower.startsWith("/.env.") ||
        lower === "/.git" || lower.startsWith("/.git/") ||
        lower.includes("/.git/") || lower.endsWith(".bak") || lower.endsWith(".swp") ||
        lower === "/.ds_store" || lower.endsWith("npm-debug.log");
      if (url.pathname.split("/").some((seg) => seg.startsWith(".")) || sensitive) {
        res.writeHead(404, { ...securityHeaders(), "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        if (req.method === "HEAD") return res.end();
        return res.end("Nao encontrado.");
      }
      const distDir = path.join(__dirname, "dist");
      const resolved = path.resolve(
        path.join(distDir, decodeURIComponent(url.pathname)),
      );
      if (
        resolved === distDir ||
        resolved.startsWith(`${distDir}${path.sep}`)
      ) {
        try {
          const stat = await fs.stat(resolved);
          if (!stat.isFile()) throw new Error("Não é arquivo.");
          const ext = path.extname(resolved).toLowerCase();
          const types = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript",
            ".css": "text/css",
            ".png": "image/png",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
            ".json": "application/json",
            ".webmanifest": "application/manifest+json",
            ".webp": "image/webp",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".woff2": "font/woff2",
            ".webm": "video/webm",
            ".mp4": "video/mp4",
            ".mp3": "audio/mpeg",
          };
          // Assets com hash no nome podem ser imutáveis; HTML nunca.
          const immutableMedia = /^\/(?:nameplates|profile-art|profile-frames|cosmetics-)/.test(url.pathname);
          const cache = ext === ".html" || url.pathname === "/"
            ? "no-cache"
            : (resolved.includes(`${path.sep}assets${path.sep}`) || immutableMedia ? "public, max-age=31536000, immutable" : "public, max-age=3600");
          const range = parseSingleByteRange(req.headers.range, stat.size);
          if (range === false) {
            res.writeHead(416, {
              ...securityHeaders(),
              "Content-Range": `bytes */${stat.size}`,
              "Accept-Ranges": "bytes",
              "Cache-Control": cache,
            });
            return res.end();
          }
          const start = range?.start ?? 0;
          const end = range?.end ?? stat.size - 1;
          res.writeHead(range ? 206 : 200, {
            ...securityHeaders(),
            "Content-Type":
              types[ext] ||
              "application/octet-stream",
            "Content-Length": Math.max(0, end - start + 1),
            "Accept-Ranges": "bytes",
            ...(range ? { "Content-Range": `bytes ${start}-${end}/${stat.size}` } : {}),
            "Cache-Control": cache,
          });
          if (req.method === "HEAD") return res.end();
          const stream = createReadStream(resolved, { start, end, highWaterMark: 32 * 1024 });
          stream.on("error", () => res.destroy());
          res.on("close", () => stream.destroy());
          stream.pipe(res);
          return;
        } catch {
          /* cai para o index.html (SPA) */
        }
        // SPA fallback só para rotas sem extensão (rotas do app).
        // Caminhos com extensão desconhecida -> 404, não 200.
        if (path.extname(url.pathname)) {
          res.writeHead(404, { ...securityHeaders(), "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
          if (req.method === "HEAD") return res.end();
          return res.end("Nao encontrado.");
        }
        try {
          const index = await fs.readFile(path.join(distDir, "index.html"));
          res.writeHead(200, {
            ...securityHeaders(),
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
          });
          if (req.method === "HEAD") return res.end();
          return res.end(index);
        } catch {
          /* dist ainda não existe */
        }
      }
    }
    let user = getUser(req);
    if (!user) return json(res, 401, { error: "Autenticação necessária." });
    const profileMediaMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/media\/(avatar|banner|appBackground)$/);
    if (profileMediaMatch) {
      if (req.method !== "GET" && req.method !== "HEAD")
        return json(req, res, 405, { error: "Método não permitido." }, { Allow: "GET, HEAD" });
      const target = database.users.find((item) => item.id === profileMediaMatch[1]);
      const mediaField = profileMediaMatch[2];
      if (!target || (mediaField === "appBackground" ? target.id !== user.id : !canViewUser(user, target)))
        return json(req, res, 404, { error: "Mídia de perfil não encontrada." });
      const media = profileMediaPayload(
        mediaField === "appBackground" ? target.preferences?.appBackground : target[mediaField],
      );
      if (!media) return json(req, res, 404, { error: "Mídia de perfil não encontrada." });
      res.writeHead(200, {
        ...securityHeaders(),
        "Content-Type": media.contentType,
        "Content-Length": media.bytes.length,
        "Cache-Control": "private, max-age=31536000, immutable",
      });
      return req.method === "HEAD" ? res.end() : res.end(media.bytes);
    }
    if (url.pathname === "/api/auth/logout" && req.method === "POST") {
      await revokeSession(sessionToken(req));
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
      await saveDatabase("subscriptions");
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
      const requestedPage = Number(url.searchParams.get("page") || 1);
      const requestedLimit = Number(url.searchParams.get("limit") || 24);
      const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
      const limit = Number.isSafeInteger(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 50)) : 24;
      const matches = GAME_CATALOG.filter((game) => !query || game.name.toLowerCase().includes(query));
      const pages = Math.max(1, Math.ceil(matches.length / limit));
      const safePage = Math.min(page, pages);
      return json(res, 200, {
        games: matches.slice((safePage - 1) * limit, safePage * limit),
        pagination: { page: safePage, pageSize: limit, pages, total: matches.length },
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
      await saveDatabase("adminCatalog");
      return json(res, 201, { item });
    }
    const catalogItemMatch = url.pathname.match(new RegExp("^/api/admin/catalog/([^/]+)$"));
    if (catalogItemMatch && req.method === "DELETE") {
      if (!isMasterAdmin(user))
        return json(res, 403, { error: "Acesso de admin master necessário." });
      const item = database.adminCatalog.find((entry) => entry.id === catalogItemMatch[1]);
      if (!item) return json(res, 404, { error: "Item não encontrado." });
      item.active = false;
      await saveDatabase("adminCatalog");
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
      const proposedBadges = input.badges !== undefined && canManageBadges(user) ? sanitizeBadges(user, input.badges) : user.badges;
      const hasNitroForRequest = badgesForUser({ ...user, badges: proposedBadges }).includes("nitro_classic");
      if (!hasNitroForRequest &&
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
      const invalidDisplayName = displayNameError(displayName);
      if (invalidDisplayName) return json(res, 400, { error: invalidDisplayName });
      const minimumUsernameLength = minimumUsernameLengthFor(user, username);
      if (!new RegExp(`^[a-z0-9_.-]{${minimumUsernameLength},20}$`).test(username))
        return json(res, 400, {
          error:
            `Usuário inválido: use de ${minimumUsernameLength} a 20 caracteres (letras, números, ponto, hífen ou underline), sem espaços.`,
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
        const passError = passwordError(String(input.password), { username: user.username, email: user.email });
        if (passError)
          return json(res, 400, {
            error: passError,
          });
        user.password = hashPassword(String(input.password));
      }
      if (input.avatar !== undefined) {
        if (input.avatar === null || input.avatar === "") user.avatar = null;
        else if (
          safeImageDataUrl(input.avatar)
        )
          user.avatar = input.avatar;
        else if (input.avatar === publicProfileMedia(user, "avatar")) {
          // O editor pode reenviar a URL pública atual ao salvar outro campo.
        }
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
        else if (input.banner === publicProfileMedia(user, "banner")) {
          // Mantém a mídia atual quando só outra preferência foi alterada.
        }
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
      if (input.nameEffect !== undefined) {
        const validNameEffect = NAME_EFFECTS.some(([value]) => value === input.nameEffect);
        user.nameEffect = validNameEffect ? input.nameEffect : "solid";
      }
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
        bannerPreset: ["none","aurora","midnight","sunset","ocean","forest","candy","ember","silver", ...PREMIUM_BANNER_PRESETS],
        effectIntensity: ["subtle","balanced","vivid"], effectSpeed: ["slow","normal","fast"],
        profileOverlay: PROFILE_OVERLAYS.map(([id])=>id)
      })) {
        if (input[field] === undefined) continue;
        if (!allowed.includes(input[field])) return json(res, 400, {error: "Personalização de perfil inválida."});
        if (!hasNitroForRequest && ((field === "bannerPreset" && PREMIUM_BANNER_PRESETS.includes(input[field])) || (field === "profileOverlay" && PREMIUM_PROFILE_OVERLAYS.includes(input[field]))))
          return json(res, 403, {error: "Esta personalização animada requer a insígnia Nitro Classic."});
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
      if (input.profilePlate !== undefined) {
        if (NAMEPLATE_IDS.has(input.profilePlate) && !hasNitroForRequest)
          return json(res, 403, {error: "Esta placa de identificação requer a insígnia Nitro Classic."});
        user.profilePlate = ["default", "stars", "waves", "neon", "clouds", "flora", "holo"].includes(
          input.profilePlate,
        ) || NAMEPLATE_IDS.has(input.profilePlate)
          ? input.profilePlate
          : "default";
      }
      if (input.profileArtEffect !== undefined) {
        if (input.profileArtEffect !== "none" && !PROFILE_ART_IDS.has(input.profileArtEffect))
          return json(res, 400, {error: "Efeito animado de perfil inválido."});
        if (input.profileArtEffect !== "none" && !hasNitroForRequest)
          return json(res, 403, {error: "Este efeito animado de perfil requer a insígnia Nitro Classic."});
        user.profileArtEffect = input.profileArtEffect;
      }
      if (input.profileFrame !== undefined) {
        if (input.profileFrame !== "none" && !PROFILE_FRAME_IDS.has(input.profileFrame))
          return json(res, 400, {error: "Moldura de perfil inválida."});
        if (input.profileFrame !== "none" && !hasNitroForRequest)
          return json(res, 403, {error: "Esta moldura de perfil requer a insígnia Nitro Classic."});
        user.profileFrame = input.profileFrame;
      }
      if (input.profileEffect !== undefined)
        user.profileEffect = PROFILE_EFFECTS.map(([value]) => value).includes(
          input.profileEffect,
        )
          ? input.profileEffect
          : "none";
      if (input.avatarFrame !== undefined && !hasNitroForRequest && PREMIUM_AVATAR_FRAMES.includes(input.avatarFrame))
        return json(res, 403, {error: "Esta moldura animada requer a insígnia Nitro Classic."});
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
        if (!canManageBadges(user))
          return json(res, 403, {
            error: "Acesso de criador necessário para gerenciar insígnias.",
          });
        user.badges = proposedBadges;
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
        for (const key of [
          "allowDirectMessages",
          "allowFriendRequests",
          "notificationSounds",
          "reducedMotion",
          "improveSesh",
          "personalizedExperience",
          "shareProfileUpdates",
        ])
          if (input.preferences[key] !== undefined) user.preferences[key] = Boolean(input.preferences[key]);
        if (input.preferences.appTheme !== undefined) {
          if (!["dark", "midnight", "light"].includes(input.preferences.appTheme))
            return json(res, 400, { error: "Tema da interface inválido." });
          user.preferences.appTheme = input.preferences.appTheme;
        }
        for (const key of ["appSurfaceColor", "appAccentColor"]) {
          if (input.preferences[key] === undefined) continue;
          if (input.preferences[key] !== null && !/^#[0-9a-fA-F]{6}$/.test(String(input.preferences[key])))
            return json(res, 400, { error: "Cor da interface inválida." });
          user.preferences[key] = input.preferences[key];
        }
        if (input.preferences.appBackground !== undefined) {
          const background = input.preferences.appBackground;
          if (background === null || background === "") user.preferences.appBackground = null;
          else if (safeImageDataUrl(background)) user.preferences.appBackground = background;
          else if (background === privatePreferenceMedia(user, "appBackground")) {
            // A tela pode reenviar a URL privada atual ao salvar apenas as cores.
          } else return json(res, 400, { error: "Imagem de fundo inválida: use PNG, JPEG, WebP ou GIF de até 3 MB." });
        }
        if (input.preferences.appBackgroundStrength !== undefined) {
          const strength = Number(input.preferences.appBackgroundStrength);
          if (!Number.isFinite(strength) || strength < 10 || strength > 100)
            return json(res, 400, { error: "Intensidade da imagem de fundo inválida." });
          user.preferences.appBackgroundStrength = Math.round(strength);
        }
      }
      user.displayName = displayName;
      user.username = username;
      Object.assign(storedUser, user);
      await saveDatabase("users");
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
      if (!canManageBadges(user))
        return json(res, 403, {
          error: "Acesso de criador necessário para gerenciar insígnias.",
        });
      const target = database.users.find((item) => item.id === badgeMatch[1]);
      if (!target) return json(res, 404, { error: "Usuário não encontrado." });
      const input = await body(req);
      target.badges = sanitizeBadges(target, input.badges);
      await saveDatabase("users");
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
      await saveDatabase("servers", "channels", "memberships", "messages");
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
          if (!membership || membership.roleId === roleId) continue;
          if (userId === server.ownerId && !isOwner)
            return json(res, 403, { error: "Somente o dono pode alterar o próprio cargo de exibição." });
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
        membership.role = membership.userId === server.ownerId ? "owner" : roleId === "member" ? "member" : "custom";
      }
      await saveDatabase("servers", "memberships");
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
    const messageMatch = url.pathname.match(
      /^\/api\/channels\/([^/]+)\/messages\/([^/]+)$/,
    );
    const messageReactionMatch = url.pathname.match(
      /^\/api\/channels\/([^/]+)\/messages\/([^/]+)\/reactions$/,
    );
    const messageReportMatch = url.pathname.match(
      /^\/api\/channels\/([^/]+)\/messages\/([^/]+)\/report$/,
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
      if (input.textMuted !== undefined) {
        target.textMuted = Boolean(input.textMuted);
        target.textMutedAt = target.textMuted ? now() : null;
        target.textMutedBy = target.textMuted ? user.id : null;
      }
      if (input.voiceMuted !== undefined) {
        target.voiceMuted = Boolean(input.voiceMuted);
        target.voiceMutedAt = target.voiceMuted ? now() : null;
        target.voiceMutedBy = target.voiceMuted ? user.id : null;
      }
      await saveDatabase("memberships");
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
      await saveDatabase("memberships");
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
      await saveDatabase("channels");
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
      await saveDatabase("channels", "messages");
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
      await saveDatabase("channels");
      broadcastServer(server.id, {
        type: "channel.updated",
        serverId: server.id,
        channel,
      });
      return json(res, 200, { channel });
    }
    if (messageReactionMatch && req.method === "POST") {
      const channel = channelForUser(user, messageReactionMatch[1]);
      const message = channel && database.messages.find(
        (item) => item.id === messageReactionMatch[2] && item.channelId === channel.id,
      );
      const server = channel && database.servers.find((item) => item.id === channel.serverId);
      if (!channel || !message || !server)
        return json(res, 404, { error: "Mensagem não encontrada." });
      if (!hasServerPermission(user, server, "addReactions"))
        return json(res, 403, { error: "Seu cargo não pode adicionar reações." });
      const input = await body(req);
      const emoji = String(input.emoji || "").trim();
      if (!emoji || [...emoji].length > 12 || emoji.length > 32)
        return json(res, 400, { error: "Escolha uma reação válida." });
      if (!Array.isArray(message.reactions)) message.reactions = [];
      let reaction = message.reactions.find((item) => item.emoji === emoji);
      if (!reaction) {
        reaction = { emoji, userIds: [] };
        message.reactions.push(reaction);
      }
      if (!Array.isArray(reaction.userIds)) reaction.userIds = [];
      reaction.userIds = reaction.userIds.includes(user.id)
        ? reaction.userIds.filter((userId) => userId !== user.id)
        : [...reaction.userIds, user.id];
      message.reactions = message.reactions.filter((item) => item.userIds?.length);
      await saveDatabase("messages");
      const output = decorateMessage(message);
      broadcast(channel.id, { type: "message.updated", message: output });
      return json(res, 200, { message: output });
    }
    if (messageReportMatch && req.method === "POST") {
      const channel = channelForUser(user, messageReportMatch[1]);
      const message = channel && database.messages.find(
        (item) => item.id === messageReportMatch[2] && item.channelId === channel.id,
      );
      if (!channel || !message)
        return json(res, 404, { error: "Mensagem não encontrada." });
      if (message.authorId === user.id)
        return json(res, 400, { error: "Você não pode denunciar a própria mensagem." });
      const input = await body(req);
      const reason = String(input.reason || "Conteúdo inadequado").trim().slice(0, 500);
      const previous = database.messageReports.find(
        (item) => item.messageId === message.id && item.reporterId === user.id,
      );
      if (previous) {
        previous.reason = reason || previous.reason;
        previous.updatedAt = now();
        await saveDatabase("messageReports");
        return json(res, 200, { ok: true, reportId: previous.id });
      }
      const report = {
        id: id(),
        serverId: channel.serverId,
        channelId: channel.id,
        messageId: message.id,
        reporterId: user.id,
        reason: reason || "Conteúdo inadequado",
        createdAt: now(),
      };
      database.messageReports.push(report);
      await saveDatabase("messageReports");
      return json(res, 201, { ok: true, reportId: report.id });
    }
    if (messageMatch && req.method === "PATCH") {
      const channel = channelForUser(user, messageMatch[1]);
      const message = channel && database.messages.find(
        (item) => item.id === messageMatch[2] && item.channelId === channel.id,
      );
      const server = channel && database.servers.find((item) => item.id === channel.serverId);
      if (!channel || !message || !server)
        return json(res, 404, { error: "Mensagem não encontrada." });
      const input = await body(req);
      if (input.content === undefined && input.pinned === undefined)
        return json(res, 400, { error: "Informe uma alteração válida." });
      if (input.content !== undefined && message.authorId !== user.id)
        return json(res, 403, { error: "Você só pode editar suas mensagens." });
      if (input.pinned !== undefined && !hasServerPermission(user, server, "pinMessages"))
        return json(res, 403, { error: "Seu cargo não pode fixar mensagens." });
      if (input.content !== undefined) {
        const content = String(input.content || "").trim();
        if ((!content && !message.attachment) || content.length > 4000)
          return json(res, 400, { error: "Mensagem inválida." });
        message.content = content;
        message.editedAt = now();
      }
      if (input.pinned !== undefined) {
        message.pinnedAt = input.pinned ? now() : null;
        message.pinnedBy = input.pinned ? user.id : null;
      }
      await saveDatabase("messages");
      const output = decorateMessage(message);
      broadcast(channel.id, { type: "message.updated", message: output });
      return json(res, 200, { message: output });
    }
    if (messageMatch && req.method === "DELETE") {
      const channel = channelForUser(user, messageMatch[1]);
      const message = channel && database.messages.find(
        (item) => item.id === messageMatch[2] && item.channelId === channel.id,
      );
      const server = channel && database.servers.find((item) => item.id === channel.serverId);
      if (!channel || !message || !server)
        return json(res, 404, { error: "Mensagem não encontrada." });
      if (message.authorId !== user.id && !hasServerPermission(user, server, "manageMessages"))
        return json(res, 403, { error: "Seu cargo não pode excluir esta mensagem." });
      database.messages = database.messages.filter((item) => item.id !== message.id);
      await saveDatabase("messages");
      broadcast(channel.id, { type: "message.deleted", channelId: channel.id, messageId: message.id });
      return json(res, 200, { ok: true, messageId: message.id });
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
        // Joining changes only the membership collection. Persisting every
        // collection here forced PostgreSQL deployments to stringify the full
        // message/direct-message history (including legacy attachments), which
        // could exhaust a 512 MB instance and leave the client on "Entrando...".
        await saveDatabase("memberships");
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
      const light = url.searchParams.get("attachments") === "refs";
      const rows = database.messages
        .filter((message) => message.channelId === channel.id)
        .slice(-limit);
      return json(res, 200, {
        messages: rows.map((message) => {
          const output = decorateMessage(message);
          return light ? stripAttachments(output) : output;
        }),
      });
    }
    // Busca individual (completa, com anexo): usada pelo cliente para
    // preencher sob demanda após listagem leve (?attachments=refs).
    if (messageMatch && req.method === "GET") {
      const channel = channelForUser(user, messageMatch[1]);
      const message = channel && database.messages.find(
        (item) => item.id === messageMatch[2] && item.channelId === channel.id,
      );
      if (!channel || !message)
        return json(res, 404, { error: "Mensagem não encontrada." });
      return json(res, 200, { message: decorateMessage(message) });
    }
    if (channelMatch && req.method === "POST") {
      const channel = channelForUser(user, channelMatch[1]);
      const input = await body(req);
      const clientMessageId = String(input.clientMessageId || "").trim();
      if (input.clientMessageId !== undefined && !/^[a-zA-Z0-9_-]{8,80}$/.test(clientMessageId))
        return json(res, 400, { error: "Identificador de envio inválido." });
      let content = String(input.content || "").trim();
      let attachment = input.attachment || null;
      let forwardedSource = null;
      if (input.forwardedMessageId) {
        forwardedSource = database.messages.find(
          (item) => item.id === String(input.forwardedMessageId),
        );
        const sourceChannel = forwardedSource && channelForUser(user, forwardedSource.channelId);
        if (!sourceChannel)
          return json(res, 404, { error: "Mensagem original não encontrada." });
        content = String(forwardedSource.content || "");
        attachment = forwardedSource.attachment || null;
      }
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
      const duplicate = clientMessageId && database.messages.find((item) =>
        item.channelId === channel.id && item.authorId === user.id && item.clientMessageId === clientMessageId);
      if (duplicate) return json(res, 200, { message: decorateMessage(duplicate), duplicate: true });
      const imageCommand = forwardedSource ? null : parseImageCommand(content);
      if (imageCommand?.invalid)
        return json(res, 400, { error: 'Use /image "prompt", /imagem "prompt" ou /imagensfw "prompt".' });
      if (imageCommand) {
        if (!hasServerPermission(user, server, "manageServer"))
          return json(res, 403, { error: "Somente administradores do servidor podem usar o gerador de imagens." });
        if (attachment)
          return json(res, 400, { error: "Não envie anexos junto do comando de imagem." });
        const safety = classifyImagePrompt(imageCommand.prompt);
        if (safety.prohibited)
          return json(res, 400, { error: "Esse pedido não pode ser processado." });
        if (!imageCommand.nsfw && safety.adult)
          return json(res, 400, { error: 'Conteúdo adulto deve usar /imagensfw "prompt".' });
        const releaseQuota = reserveImageGeneration(user.id);
        let generated;
        try {
          generated = await generateImage({
            prompt: imageCommand.nsfw
              ? `Adults age 25+ only. No explicit sexual activity. ${imageCommand.prompt}`
              : imageCommand.prompt,
            nsfw: imageCommand.nsfw,
          });
        } catch (error) {
          releaseQuota();
          if (!error.status) error.status = error.retryable ? 503 : 502;
          throw error;
        }
        if (!safeImageDataUrl(generated.dataUrl)) {
          releaseQuota();
          return json(res, 502, { error: "O provedor retornou uma imagem inválida ou muito grande." });
        }
        const aiMessage = {
          id: id(),
          channelId: channel.id,
          authorId: AI_SESH_USER.id,
          author: AI_SESH_USER,
          content: imageCommand.nsfw
            ? `Imagem NSFW gerada somente para você: “${imageCommand.prompt}”`
            : `Imagem gerada somente para você: “${imageCommand.prompt}”`,
          attachment: generated.dataUrl,
          ai: { nsfw: imageCommand.nsfw, ephemeral: true },
          createdAt: now(),
          editedAt: null,
        };
        return json(res, 201, { message: aiMessage, ephemeral: true });
      }
      if (attachment && !hasServerPermission(user, server, "attachFiles"))
        return json(res, 403, { error: "Seu cargo não pode enviar anexos." });
      const replyTo = input.replyToId
        ? database.messages.find(
            (item) => item.id === String(input.replyToId) && item.channelId === channel.id,
          )
        : null;
      if (input.replyToId && !replyTo)
        return json(res, 400, { error: "A mensagem respondida não existe mais neste canal." });
      const mentions = forwardedSource
        ? { targetIds: new Set(), requiresMentionPermission: false }
        : mentionInfoFor(server, content, user.id);
      if (mentions.requiresMentionPermission && !hasServerPermission(user, server, "mentionEveryone"))
        return json(res, 403, { error: "Seu cargo não pode mencionar @everyone, @here ou cargos." });
      const message = {
        id: id(),
        ...(clientMessageId ? { clientMessageId } : {}),
        channelId: channel.id,
        authorId: user.id,
        content,
        attachment,
        replyToId: replyTo?.id || null,
        forwardedFrom: forwardedSource
          ? {
              messageId: forwardedSource.id,
              channelId: forwardedSource.channelId,
              authorId: forwardedSource.authorId,
            }
          : null,
        reactions: [],
        pinnedAt: null,
        pinnedBy: null,
        createdAt: now(),
        editedAt: null,
      };
      database.messages.push(message);
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
      await saveDatabase("messages");
      return json(res, 201, { message: output });
    }
    const dmMatch = url.pathname.match(/^\/api\/direct\/([^/]+)\/messages$/);
    const dmSingleMatch = url.pathname.match(/^\/api\/direct\/([^/]+)\/messages\/([^/]+)$/);
    if (dmSingleMatch && req.method === "GET") {
      const recipient = database.users.find((item) => item.id === dmSingleMatch[1]);
      const friendship = database.friendships.some((item) => item.status === "accepted" &&
        [item.requesterId, item.addresseeId].includes(user.id) &&
        [item.requesterId, item.addresseeId].includes(recipient?.id));
      if (!recipient || recipient.id === user.id || !friendship)
        return json(res, 403, { error: "Adicione e aceite esta pessoa como amiga para conversar." });
      const message = database.directMessages.find((item) => item.id === dmSingleMatch[2] &&
        ((item.authorId === user.id && item.recipientId === recipient.id) ||
         (item.authorId === recipient.id && item.recipientId === user.id)));
      if (!message) return json(res, 404, { error: "Mensagem não encontrada." });
      return json(res, 200, { message: decorateMessage(message) });
    }
    if (dmMatch && ["GET", "POST"].includes(req.method)) {
      const recipient = database.users.find((item) => item.id === dmMatch[1]);
      const friendship = database.friendships.some((item) => item.status === "accepted" &&
        [item.requesterId, item.addresseeId].includes(user.id) &&
        [item.requesterId, item.addresseeId].includes(recipient?.id));
      if (!recipient || recipient.id === user.id || !friendship)
        return json(res, 403, { error: "Adicione e aceite esta pessoa como amiga para conversar." });
      if (req.method === "GET") {
        const light = url.searchParams.get("attachments") === "refs";
        const messages = database.directMessages.filter((item) =>
          (item.authorId === user.id && item.recipientId === recipient.id) ||
          (item.authorId === recipient.id && item.recipientId === user.id));
        return json(res, 200, {
          messages: messages.slice(-100).map((message) => {
            const output = decorateMessage(message);
            return light ? stripAttachments(output) : output;
          }),
        });
      }
      if (recipient.preferences?.allowDirectMessages === false)
        return json(res, 403, { error: "Esta pessoa pausou o recebimento de mensagens diretas." });
      const input = await body(req);
      const clientMessageId = String(input.clientMessageId || "").trim();
      if (input.clientMessageId !== undefined && !/^[a-zA-Z0-9_-]{8,80}$/.test(clientMessageId))
        return json(res, 400, { error: "Identificador de envio inválido." });
      const content = String(input.content || "").trim();
      const attachment = input.attachment || null;
      if ((!content && !attachment) || content.length > 4000 || (attachment && !safeAttachment(attachment)))
        return json(res, 400, { error: "Envie até 4000 caracteres ou uma imagem PNG, JPEG, GIF ou WebP de até 3 MB." });
      const duplicate = clientMessageId && database.directMessages.find((item) => item.authorId === user.id && item.recipientId === recipient.id && item.clientMessageId === clientMessageId);
      if (duplicate) return json(res, 200, { message: decorateMessage(duplicate), duplicate: true });
      const message = { id: id(), ...(clientMessageId ? { clientMessageId } : {}), authorId: user.id, recipientId: recipient.id, content, attachment, createdAt: now(), editedAt: null };
      database.directMessages.push(message);
      const output = decorateMessage(message);
      notifyUser(recipient.id, { type: "direct.created", message: output });
      notifyUser(user.id, { type: "direct.created", message: output });
      await saveDatabase("directMessages");
      return json(res, 201, { message: output });
    }
    if (url.pathname === "/api/direct-groups" && req.method === "GET") {
      const groups = database.directGroups
        .filter((group) => group.memberIds.includes(user.id))
        .map(directGroupView)
        .sort((first, second) => String(second.updatedAt).localeCompare(String(first.updatedAt)));
      return json(res, 200, { groups });
    }
    if (url.pathname === "/api/direct-groups" && req.method === "POST") {
      const input = await body(req);
      const memberIds = [...new Set((Array.isArray(input.memberIds) ? input.memberIds : [])
        .filter((userId) => typeof userId === "string" && userId !== user.id))].slice(0, 7);
      if (memberIds.length < 2) return json(res, 400, { error: "Escolha pelo menos dois amigos para o grupo." });
      if (memberIds.some((memberId) => !database.users.some((person) => person.id === memberId) || !acceptedFriends(user.id, memberId)))
        return json(res, 403, { error: "Grupos de DM só podem incluir amizades aceitas." });
      const automaticName = memberIds
        .map((memberId) => database.users.find((person) => person.id === memberId)?.displayName)
        .filter(Boolean).slice(0, 3).join(", ");
      const name = String(input.name || automaticName || "Novo grupo").trim();
      if (!name || name.length > 60) return json(res, 400, { error: "Use um nome de grupo com até 60 caracteres." });
      const group = { id: id(), name, ownerId: user.id, memberIds: [user.id, ...memberIds], messages: [], createdAt: now() };
      database.directGroups.push(group);
      await saveDatabase("directGroups");
      const output = directGroupView(group);
      for (const memberId of group.memberIds) notifyUser(memberId, { type: "direct.groups.updated", group: output });
      return json(res, 201, { group: output });
    }
    const directGroupMessagesMatch = url.pathname.match(/^\/api\/direct-groups\/([^/]+)\/messages$/);
    if (directGroupMessagesMatch && ["GET", "POST"].includes(req.method)) {
      const group = database.directGroups.find((item) => item.id === directGroupMessagesMatch[1] && item.memberIds.includes(user.id));
      if (!group) return json(res, 404, { error: "Grupo não encontrado." });
      if (req.method === "GET") return json(res, 200, { messages: (group.messages || []).slice(-100).map(decorateMessage) });
      const input = await body(req);
      const clientMessageId = String(input.clientMessageId || "").trim();
      if (input.clientMessageId !== undefined && !/^[a-zA-Z0-9_-]{8,80}$/.test(clientMessageId))
        return json(res, 400, { error: "Identificador de envio inválido." });
      const content = String(input.content || "").trim();
      const attachment = input.attachment || null;
      if ((!content && !attachment) || content.length > 4000 || (attachment && !safeAttachment(attachment)))
        return json(res, 400, { error: "Envie até 4000 caracteres ou um arquivo válido de até 3 MB." });
      const duplicate = clientMessageId && group.messages?.find((message) => message.authorId === user.id && message.clientMessageId === clientMessageId);
      if (duplicate) return json(res, 200, { message: decorateMessage(duplicate), duplicate: true });
      const message = { id: id(), groupId: group.id, ...(clientMessageId ? { clientMessageId } : {}), authorId: user.id, content, attachment, createdAt: now(), editedAt: null };
      group.messages ||= [];
      group.messages.push(message);
      await saveDatabase("directGroups");
      const output = decorateMessage(message);
      for (const memberId of group.memberIds) notifyUser(memberId, { type: "direct.group.created", groupId: group.id, message: output });
      return json(res, 201, { message: output });
    }
    if (url.pathname === "/api/private-calls" && req.method === "POST") {
      const input = await body(req);
      const group = typeof input.groupId === "string"
        ? database.directGroups.find((item) => item.id === input.groupId && item.memberIds.includes(user.id))
        : null;
      const participantIds = group
        ? group.memberIds.filter((userId) => userId !== user.id).slice(0, 7)
        : [...new Set((Array.isArray(input.participantIds) ? input.participantIds : [])
          .filter((userId) => typeof userId === "string" && userId !== user.id))].slice(0, 7);
      if (!participantIds.length)
        return json(res, 400, { error: "Escolha pelo menos um amigo para a chamada." });
      const invited = participantIds.map((userId) => database.users.find((item) => item.id === userId));
      if (invited.some((target, index) => !target || (!group && !acceptedFriends(user.id, participantIds[index]))))
        return json(res, 403, { error: "Chamadas privadas só podem incluir amizades aceitas." });
      const call = {
        id: crypto.randomBytes(12).toString("base64url"),
        creatorId: user.id,
        participantIds: [user.id, ...participantIds],
        groupId: group?.id || null,
        name: group?.name || null,
        createdAt: Date.now(),
      };
      privateCalls.set(call.id, call);
      const output = privateCallView(call, user.id);
      for (const targetId of participantIds)
        notifyUser(targetId, { type: "private.call.invited", call: privateCallView(call, targetId) });
      return json(res, 201, { call: output });
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
      const friendId = String(input.username || "").trim();
      const match = friendId.toLowerCase().match(/^@?([a-z0-9_.-]{1,20})(?:#(\d{4}))?$/i);
      const publicId = friendId.toUpperCase();
      if (!match && !/^S-[A-F0-9]{10}$/.test(publicId))
        return json(res, 400, {
          error: "Use @nome ou o ID público no formato S-XXXXXXXXXX.",
        });
      const [, username, tag] = match || [];
      const target = database.users.find(
        (item) =>
          String(item.publicId || "").toUpperCase() === publicId ||
          (item.username === username && (!tag || userTag(item) === tag)),
      );
      if (!target)
        return json(res, 404, {
          error: "Usuário não encontrado. Confira o @ ou o ID público.",
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
          await saveDatabase("friendships");
          notifyUser(target.id, { type: "friends.updated" });
          notifyUser(user.id, { type: "friends.updated" });
          return json(res, 200, { ok: true, accepted: true });
        }
        return json(res, 409, {
          error: "Você já enviou um convite para esta pessoa.",
        });
      }
      if (target.preferences?.allowFriendRequests === false)
        return json(res, 403, { error: "Esta pessoa pausou o recebimento de pedidos de amizade." });
      database.friendships.push({
        id: id(),
        requesterId: user.id,
        addresseeId: target.id,
        status: "pending",
        createdAt: now(),
      });
      await saveDatabase("friendships");
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
      await saveDatabase("friendships");
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
      await saveDatabase("friendships");
      notifyUser(friendship.requesterId, { type: "friends.updated" });
      notifyUser(friendship.addresseeId, { type: "friends.updated" });
      return json(res, 200, { ok: true });
    }
    // Método errado em rota conhecida -> 405 (em vez de 404 genérico).
    const knownMethods = {
      "/api/auth/login": ["POST"],
      "/api/auth/register": ["POST"],
      "/api/auth/logout": ["POST"],
      "/api/auth/me": ["GET", "PATCH"],
      "/api/auth/ws-ticket": ["POST"],
      "/api/auth/resend-verification": ["POST"],
      "/api/subscriptions/plans": ["GET"],
      "/api/subscriptions/me": ["GET"],
      "/api/catalog": ["GET"],
      "/api/games": ["GET"],
      "/api/servers": ["GET", "POST"],
      "/api/friends": ["GET", "POST"],
      "/api/private-calls": ["POST"],
      "/api/direct-groups": ["GET", "POST"],
    };
    const allowed = knownMethods[url.pathname];
    if (allowed && !allowed.includes(req.method))
      return json(req, res, 405, { error: "Método não permitido." }, { Allow: allowed.join(", ") });
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
      if (event.type === "connection.ping") {
        if (Number.isSafeInteger(event.sentAt))
          socket.send(JSON.stringify({ type: "connection.pong", sentAt: event.sentAt }));
      } else if (event.type === "voice.join" || event.type === "voice.leave") {
        if (typeof event.channelId !== "string" || event.channelId.length > 80)
          return;
        const channel = database.channels.find(
          (item) => item.id === event.channelId && item.type === "voice",
        );
        const privateCall = privateCallForChannel(event.channelId);
        const caller = database.users.find((item) => item.id === userId);
        if (
          (!channel && !privateCall) ||
          (channel && !serverForUser(caller, channel.serverId)) ||
          (privateCall && !privateCall.participantIds.includes(userId))
        )
          return;
        const roomId = event.channelId;
        if (!voiceRooms.has(roomId)) voiceRooms.set(roomId, new Map());
        const membership = channel ? membershipFor(caller, channel.serverId) : null;
        if (channel && event.type === "voice.join" && (!hasServerPermission(caller, database.servers.find((item) => item.id === channel.serverId), "connectVoice") || membership?.voiceMuted)) {
          socket.send(JSON.stringify({ type: "voice.denied", channelId: roomId, reason: membership?.voiceMuted ? "Você está silenciado na voz deste servidor." : "Seu cargo não pode entrar em canais de voz." }));
          return;
        }
        const room = voiceRooms.get(roomId);
        const wasPresent = room.has(userId);
        const changing = event.type === "voice.join" ? !wasPresent : wasPresent;
        if (event.type === "voice.join")
          room.set(userId, {
            muted: false,
            deafened: false,
            camera: false,
            screen: false,
            relayAudio: Boolean(event.relayAudio),
          });
        else room.delete(userId);
        if (changing) {
          broadcastVoice(roomId, {
            type: "voice.participants",
            channelId: roomId,
            participants: voiceParticipants(roomId),
          });
          if (channel) broadcastVoiceState(channel);
        }
        if (event.type === "voice.leave" && room.size === 0)
          voiceRooms.delete(roomId);
      } else if (event.type === "voice.media") {
        if (typeof event.channelId !== "string" || event.channelId.length > 80)
          return;
        const channel = database.channels.find(
          (item) => item.id === event.channelId && item.type === "voice",
        );
        const privateCall = privateCallForChannel(event.channelId);
        const room = (channel || privateCall) && voiceRooms.get(event.channelId);
        const caller = database.users.find((item) => item.id === userId);
        const voiceServer = channel && database.servers.find((item) => item.id === channel.serverId);
        if (!room?.has(userId) || !caller || (!voiceServer && !privateCall)) return;
        if (channel && event.camera && !hasServerPermission(caller, voiceServer, "useCamera"))
          return socket.send(JSON.stringify({ type: "voice.media.denied", channelId: channel.id, reason: "Seu cargo não pode usar câmera neste servidor." }));
        if (channel && event.screen && !hasServerPermission(caller, voiceServer, "shareScreen"))
          return socket.send(JSON.stringify({ type: "voice.media.denied", channelId: channel.id, reason: "Seu cargo não pode compartilhar tela neste servidor." }));
        room.set(userId, {
          ...room.get(userId),
          muted: Boolean(event.muted),
          deafened: Boolean(event.deafened),
          camera: Boolean(event.camera),
          screen: Boolean(event.screen),
        });
        broadcastVoice(event.channelId, {
          type: "voice.participants",
          channelId: event.channelId,
          participants: voiceParticipants(event.channelId),
        });
        if (channel) broadcastVoiceState(channel);
      } else if (event.type === "voice.audio") {
        if (
          typeof event.channelId !== "string" ||
          event.channelId.length > 80 ||
          typeof event.samples !== "string" ||
          event.samples.length > 24_000 ||
          !/^[A-Za-z0-9+/]+={0,2}$/.test(event.samples) ||
          !Number.isInteger(event.sampleRate) ||
          event.sampleRate < 8_000 ||
          event.sampleRate > 48_000
        ) return;
        const room = voiceRooms.get(event.channelId);
        if (!room?.has(userId) || ![...room.values()].some((media) => media.relayAudio)) return;
        for (const targetUserId of room.keys()) {
          if (targetUserId === userId) continue;
          const target = sockets.get(targetUserId);
          if (target?.readyState === 1)
            target.send(JSON.stringify({
              type: "voice.audio",
              channelId: event.channelId,
              fromUserId: userId,
              sampleRate: event.sampleRate,
              samples: event.samples,
            }));
        }
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
        broadcastVoice(channelId, { type: "voice.participants", channelId, participants: voiceParticipants(channelId) });
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
