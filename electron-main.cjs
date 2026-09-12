const {
  app,
  BrowserWindow,
  dialog,
  session,
  desktopCapturer,
  safeStorage,
  shell,
} = require("electron");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { pathToFileURL } = require("node:url");

let backend;
let window;
const backendPort = app.isPackaged ? 38471 : 3001;
function isNewerVersion(candidate, current) {
  const parse = (value) => String(value || "0.0.0").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const next = parse(candidate);
  const installed = parse(current);
  for (let index = 0; index < 3; index += 1) {
    if (next[index] !== installed[index]) return next[index] > installed[index];
  }
  return false;
}
async function checkForUpdates() {
  const manifestUrl = String(process.env.SESH_UPDATE_MANIFEST_URL || "https://sesh-web.onrender.com/releases/latest.json").trim();
  if (!app.isPackaged || !manifestUrl) return;
  try {
    const response = await fetch(manifestUrl, {
      headers: { "user-agent": `Sesh/${app.getVersion()}` },
      signal: AbortSignal.timeout(8_000),
    });
    const manifest = await response.json();
    if (!response.ok || !isNewerVersion(manifest.version, app.getVersion()) || !/^https?:\/\//.test(manifest.downloadUrl || "")) return;
    const result = await dialog.showMessageBox(window, {
      type: "info",
      title: "Atualização do Sesh disponível",
      message: `A versão ${manifest.version} está disponível.`,
      detail: manifest.notes || "Baixe o novo pacote para continuar com recursos e correções atuais.",
      buttons: ["Atualizar agora", "Mais tarde"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    if (result.response === 0) await shell.openExternal(manifest.downloadUrl);
  } catch {
    // Atualizações são opcionais; a ausência temporária do manifesto não bloqueia o app.
  }
}

function encryptedDataKey() {
  if (!safeStorage.isEncryptionAvailable())
    throw new Error("A proteção de dados do Windows não está disponível.");
  const keyPath = path.join(app.getPath("userData"), "data-key.bin");
  if (fs.existsSync(keyPath))
    return safeStorage.decryptString(fs.readFileSync(keyPath));
  const key = crypto.randomBytes(32).toString("base64");
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  fs.writeFileSync(keyPath, safeStorage.encryptString(key));
  return key;
}
async function startBackend() {
  process.env.HOST = "127.0.0.1";
  process.env.PORT = String(backendPort);
  if (app.isPackaged) {
    process.env.DATA_FILE = path.join(app.getPath("userData"), "sesh-data.enc");
    process.env.DATA_ENCRYPTION_KEY = encryptedDataKey();
  }
  const backendModule = await import(
    pathToFileURL(path.join(__dirname, "server.js")).href
  );
  backend = backendModule.server;
}
function waitForBackend(attempt = 0) {
  if (attempt > 30)
    return dialog.showErrorBox("Sesh", "O servidor local não respondeu.");
  const request = http.get(
    `http://127.0.0.1:${backendPort}/api/health`,
    (response) => {
      if (response.statusCode === 200)
        window.loadURL(
          app.isPackaged
            ? `http://127.0.0.1:${backendPort}/app`
            : "http://127.0.0.1:5173/app",
        );
      else setTimeout(() => waitForBackend(attempt + 1), 250);
    },
  );
  request.on("error", () => setTimeout(() => waitForBackend(attempt + 1), 250));
}
function createWindow() {
  window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0c101a",
    title: "Sesh",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!isTrustedUrl(url)) event.preventDefault();
  });
  waitForBackend();
}
function isTrustedUrl(value) {
  try {
    const url = new URL(value);
    return (
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      ["5173", String(backendPort)].includes(url.port)
    );
  } catch {
    return false;
  }
}
app.whenReady().then(async () => {
  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin) =>
      isTrustedUrl(requestingOrigin) && permission === "media",
  );
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      callback(
        isTrustedUrl(
          details.requestingUrl ||
            details.securityOrigin ||
            webContents.getURL(),
        ) && permission === "media",
      );
    },
  );
  session.defaultSession.setDisplayMediaRequestHandler(
    async (request, callback) => {
      if (!request.userGesture || !isTrustedUrl(request.securityOrigin))
        return callback({});
      try {
        const sources = (
          await desktopCapturer.getSources({
            types: ["window", "screen"],
            thumbnailSize: { width: 0, height: 0 },
          })
        ).slice(0, 8);
        if (!sources.length) return callback({});
        const cancelId = sources.length;
        const result = await dialog.showMessageBox(window, {
          type: "question",
          title: "Compartilhar tela",
          message: "Escolha a tela ou janela que deseja compartilhar",
          buttons: [...sources.map((source) => source.name), "Cancelar"],
          cancelId,
          defaultId: 0,
          noLink: true,
        });
        if (result.response === cancelId) return callback({});
        callback({ video: sources[result.response], enableLocalEcho: false });
      } catch {
        callback({});
      }
    },
  );
  try {
    await startBackend();
  } catch (error) {
    dialog.showErrorBox(
      "Sesh",
      `Não foi possível iniciar o servidor protegido: ${error.message}`,
    );
    app.quit();
    return;
  }
  createWindow();
  setTimeout(checkForUpdates, 2_500);
});
app.on("window-all-closed", () => {
  if (backend?.listening) backend.close();
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", () => {
  if (backend?.listening) backend.close();
});
