const { app, BrowserWindow, dialog, session } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

let backend;
let window;

function startBackend() {
  backend = spawn(process.platform === 'win32' ? 'node.exe' : 'node', [path.join(__dirname, 'server.js')], { cwd: __dirname, stdio: 'inherit', windowsHide: true });
  backend.on('error', error => dialog.showErrorBox('Sesh', `Não foi possível iniciar o servidor local: ${error.message}`));
  backend.on('exit', code => { if (code && code !== 0) console.log(`Servidor já estava ativo ou encerrou com código ${code}.`); });
}
function waitForBackend(attempt = 0) {
  if (attempt > 30) return dialog.showErrorBox('Sesh', 'O servidor local não respondeu.');
  const request = http.get('http://localhost:3001/api/health', response => { if (response.statusCode === 200) window.loadURL('http://localhost:5173'); else setTimeout(() => waitForBackend(attempt + 1), 250); });
  request.on('error', () => setTimeout(() => waitForBackend(attempt + 1), 250));
}
function createWindow() {
  window = new BrowserWindow({ width: 1400, height: 900, minWidth: 900, minHeight: 600, backgroundColor: '#0c101a', title: 'Sesh', webPreferences: { contextIsolation: true, nodeIntegration: false } });
  waitForBackend();
}
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => callback(['media', 'audioCapture', 'videoCapture', 'mediaKeySystem'].includes(permission)));
  startBackend(); createWindow();
});
app.on('window-all-closed', () => { if (backend) backend.kill(); if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (backend) backend.kill(); });
