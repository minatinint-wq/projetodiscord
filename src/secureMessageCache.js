const DB_NAME = "sesh-secure-message-cache";
const DB_VERSION = 1;
const TTL_MS = 10 * 60 * 1000;
const MAX_MESSAGES = 100;
let databasePromise;

const supported = () => typeof indexedDB !== "undefined" && Boolean(globalThis.crypto?.subtle);
const requestResult = (request) => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error("Falha no cache local."));
});

function openDatabase() {
  if (!supported()) return Promise.reject(new Error("Cache cifrado indisponível."));
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("keys")) request.result.createObjectStore("keys");
      if (!request.result.objectStoreNames.contains("entries")) request.result.createObjectStore("entries", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Falha ao abrir o cache local."));
  });
  return databasePromise;
}

async function storeRequest(name, mode, operation) {
  const database = await openDatabase();
  const transaction = database.transaction(name, mode);
  const completed = new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error("Falha no cache local."));
  });
  const result = await requestResult(operation(transaction.objectStore(name)));
  await completed;
  return result;
}

async function encryptionKey(ownerId) {
  let key = await storeRequest("keys", "readonly", (store) => store.get(ownerId));
  if (key) return key;
  key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await storeRequest("keys", "readwrite", (store) => store.put(key, ownerId));
  return key;
}

const entryId = (ownerId, scope, targetId) => `${ownerId}:${scope}:${targetId}`;
const safeMessages = (messages) => (messages || []).slice(-MAX_MESSAGES).map((message) => {
  const { pendingPayload: _pendingPayload, sendError: _sendError, ...safe } = message;
  const attachment = safe.attachment?.ref ? { ref: safe.attachment.ref, name: safe.attachment.name, type: safe.attachment.type } : null;
  return { ...safe, attachment, sendState: undefined };
});

export async function writeMessageCache(ownerId, scope, targetId, messages) {
  if (!ownerId || !targetId || !supported()) return false;
  try {
    const key = await encryptionKey(ownerId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify({ messages: safeMessages(messages), cachedAt: Date.now() }));
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
    await storeRequest("entries", "readwrite", (store) => store.put({ id: entryId(ownerId, scope, targetId), expiresAt: Date.now() + TTL_MS, iv: iv.buffer, cipher }));
    return true;
  } catch {
    return false;
  }
}

export async function readMessageCache(ownerId, scope, targetId) {
  if (!ownerId || !targetId || !supported()) return null;
  try {
    const id = entryId(ownerId, scope, targetId);
    const entry = await storeRequest("entries", "readonly", (store) => store.get(id));
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      await storeRequest("entries", "readwrite", (store) => store.delete(id));
      return null;
    }
    const key = await encryptionKey(ownerId);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(entry.iv) }, key, entry.cipher);
    const payload = JSON.parse(new TextDecoder().decode(plain));
    return Array.isArray(payload.messages) ? payload.messages : null;
  } catch {
    return null;
  }
}
