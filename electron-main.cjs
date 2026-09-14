const {
  app,
  BrowserWindow,
  dialog,
  Menu,
  session,
  desktopCapturer,
  safeStorage,
  shell,
} = require("electron");
const { autoUpdater } = require("electron-updater");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { pathToFileURL } = require("node:url");

let backend;
let window;
let updateCheckInFlight = false;
const backendPort = app.isPackaged ? 38471 : 3001;
const remoteAppUrl = "https://sesh-web-08o6.onrender.com/app";
const remoteOrigin = new URL(remoteAppUrl).origin;
async function checkForUpdates() {
  if (!app.isPackaged || updateCheckInFlight) return;
  updateCheckInFlight = true;
  try {
    await autoUpdater.checkForUpdates();
  } catch {
    // Atualizações são opcionais; uma falha de rede não bloqueia o app.
  } finally {
    updateCheckInFlight = false;
  }
}
function configureAutoUpdater() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on("update-available", async (info) => {
    const result = await dialog.showMessageBox(window, {
      type: "info",
      title: "Atualização do Sesh disponível",
      message: `A versão ${info.version} está disponível.`,
      detail: "O Sesh baixa a atualização em segundo plano e instala sobre esta versão, sem abrir navegador ou criar outro arquivo para você.",
      buttons: ["Baixar atualização", "Mais tarde"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    if (result.response === 0) {
      window?.setProgressBar(0.01);
      autoUpdater.downloadUpdate().catch(() => window?.setProgressBar(-1));
    }
  });
  autoUpdater.on("download-progress", (progress) => {
    window?.setProgressBar(Math.max(0.01, Math.min(progress.percent / 100, 1)));
  });
  autoUpdater.on("update-downloaded", async (info) => {
    window?.setProgressBar(-1);
    const result = await dialog.showMessageBox(window, {
      type: "info",
      title: "Atualização pronta",
      message: `A versão ${info.version} foi baixada.`,
      detail: "Reinicie agora para aplicar a atualização automaticamente.",
      buttons: ["Reiniciar e atualizar", "Depois"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    if (result.response === 0) autoUpdater.quitAndInstall(true, true);
  });
  autoUpdater.on("error", () => window?.setProgressBar(-1));
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
    show: process.env.SESH_DESKTOP_SMOKE_TEST !== "1",
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
  if (app.isPackaged) {
    window.webContents.on("did-fail-load", async (_event, code, description, _url, isMainFrame) => {
      if (!isMainFrame || code === -3) return;
      const result = await dialog.showMessageBox(window, { type: "warning", title: "Conectar ao Sesh", message: "Não foi possível conectar ao servidor.", detail: `${description}\nConfira sua conexão. O servidor pode estar iniciando.`, buttons: ["Tentar novamente", "Fechar"], defaultId: 0, cancelId: 1 });
      if (result.response === 0) window.loadURL(remoteAppUrl).catch(() => {}); else app.quit();
    });
    window.loadURL(remoteAppUrl).catch(() => {});
  } else waitForBackend();
}
function isTrustedUrl(value) {
  try {
    const url = new URL(value);
    if (app.isPackaged) return url.origin === remoteOrigin;
    return (
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      ["5173", String(backendPort)].includes(url.port)
    );
  } catch {
    return false;
  }
}
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  configureAutoUpdater();
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
    if (!app.isPackaged) await startBackend();
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
  setInterval(checkForUpdates, 6 * 60 * 60 * 1_000);
});
app.on("window-all-closed", () => {
  if (backend?.listening) backend.close();
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", () => {
  if (backend?.listening) backend.close();
});
