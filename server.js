import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'database.json');
const port = Number(process.env.PORT || 3001);
const sessions = new Map();
const sockets = new Map();
const voiceRooms = new Map();
let database;

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({ salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') });
const verifyPassword = (password, record) => crypto.timingSafeEqual(Buffer.from(hashPassword(password, record.salt).hash, 'hex'), Buffer.from(record.hash, 'hex'));
const initials = name => name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

async function loadDatabase() {
  await fs.mkdir(dataDir, { recursive: true });
  try { database = JSON.parse(await fs.readFile(dataFile, 'utf8')); } catch {
    const password = hashPassword('demo123');
    const userId = id();
    const serverId = id();
    const generalId = id();
    const voiceId = id();
    database = {
      users: [{ id: userId, username: 'demo', displayName: 'Usuário Demo', email: 'demo@orbit.local', password, avatarColor: 'purple', createdAt: now() }],
      servers: [{ id: serverId, name: 'Orbit Community', icon: 'O', ownerId: userId, createdAt: now() }],
      memberships: [{ userId, serverId, role: 'owner', joinedAt: now() }],
      channels: [
        { id: generalId, serverId, name: 'geral', type: 'text', topic: 'Converse, compartilhe e crie junto', position: 0, createdAt: now() },
        { id: voiceId, serverId, name: 'Sala de voz', type: 'voice', topic: 'Converse por áudio', position: 1, createdAt: now() }
      ],
      messages: [{ id: id(), channelId: generalId, authorId: userId, content: 'Bem-vindo ao Orbit! Este é o seu primeiro canal.', createdAt: now(), editedAt: null }]
    };
    await saveDatabase();
  }
}
async function saveDatabase() { await fs.writeFile(dataFile, JSON.stringify(database, null, 2)); }
function json(res, status, payload) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' }); res.end(JSON.stringify(payload)); }
function publicUser(user) { return { id: user.id, username: user.username, displayName: user.displayName, avatarColor: user.avatarColor }; }
function getUser(req) { const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const userId = sessions.get(token); return database.users.find(user => user.id === userId); }
async function body(req) { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; }
function serverForUser(user, serverId) { return database.servers.find(server => server.id === serverId && database.memberships.some(m => m.serverId === serverId && m.userId === user.id)); }
function channelForUser(user, channelId) { const channel = database.channels.find(item => item.id === channelId); return channel && serverForUser(user, channel.serverId) ? channel : null; }
function decorateMessage(message) { const user = database.users.find(item => item.id === message.authorId); return { ...message, author: publicUser(user) }; }
function decorateServer(server, user) { const memberCount = database.memberships.filter(item => item.serverId === server.id).length; const channels = database.channels.filter(item => item.serverId === server.id).sort((a, b) => a.position - b.position); return { ...server, memberCount, role: database.memberships.find(item => item.serverId === server.id && item.userId === user.id)?.role, channels }; }
function broadcast(channelId, event) { for (const [userId, socket] of sockets) { if (socket.readyState === 1) { const userChannels = database.channels.filter(channel => channel.id === channelId && database.memberships.some(m => m.serverId === channel.serverId && m.userId === userId)); if (userChannels.length) socket.send(JSON.stringify(event)); } } }
function voiceParticipants(channelId) { return [...(voiceRooms.get(channelId)?.keys() || [])].map(userId => publicUser(database.users.find(user => user.id === userId))).filter(Boolean); }
function broadcastVoice(channelId, event) { for (const userId of voiceRooms.get(channelId)?.keys() || []) { const socket = sockets.get(userId); if (socket?.readyState === 1) socket.send(JSON.stringify(event)); } }

async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, time: now() });
    if (url.pathname === '/api/auth/register' && req.method === 'POST') {
      const input = await body(req); const username = String(input.username || '').trim().toLowerCase(); const displayName = String(input.displayName || username).trim();
      if (!username || String(input.password || '').length < 6) return json(res, 400, { error: 'Usuário e senha com pelo menos 6 caracteres são obrigatórios.' });
      if (database.users.some(user => user.username === username || user.email === input.email)) return json(res, 409, { error: 'Usuário ou e-mail já cadastrado.' });
      const user = { id: id(), username, displayName, email: input.email || `${username}@orbit.local`, password: hashPassword(input.password), avatarColor: 'purple', createdAt: now() }; database.users.push(user); await saveDatabase();
      const token = id(); sessions.set(token, user.id); return json(res, 201, { token, user: publicUser(user) });
    }
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const input = await body(req); const user = database.users.find(item => item.username === String(input.username || '').toLowerCase());
      if (!user || !verifyPassword(input.password || '', user.password)) return json(res, 401, { error: 'Credenciais inválidas.' });
      const token = id(); sessions.set(token, user.id); return json(res, 200, { token, user: publicUser(user) });
    }
    const user = getUser(req);
    if (!user) return json(res, 401, { error: 'Autenticação necessária.' });
    if (url.pathname === '/api/auth/me' && req.method === 'GET') return json(res, 200, { user: publicUser(user) });
    if (url.pathname === '/api/servers' && req.method === 'GET') return json(res, 200, { servers: database.servers.filter(server => serverForUser(user, server.id)).map(server => decorateServer(server, user)) });
    if (url.pathname === '/api/servers' && req.method === 'POST') {
      const input = await body(req); const name = String(input.name || '').trim(); if (!name) return json(res, 400, { error: 'Nome do servidor é obrigatório.' });
      const server = { id: id(), name, icon: initials(name).slice(0, 1), ownerId: user.id, createdAt: now() }; database.servers.push(server); database.memberships.push({ userId: user.id, serverId: server.id, role: 'owner', joinedAt: now() }); database.channels.push({ id: id(), serverId: server.id, name: 'geral', type: 'text', topic: 'Comece uma conversa', position: 0, createdAt: now() }); await saveDatabase(); return json(res, 201, { server: decorateServer(server, user) });
    }
    const serverMatch = url.pathname.match(/^\/api\/servers\/([^/]+)$/); const channelMatch = url.pathname.match(/^\/api\/channels\/([^/]+)\/messages$/); const channelRootMatch = url.pathname.match(/^\/api\/channels\/([^/]+)$/);
    if (serverMatch && req.method === 'GET') { const server = serverForUser(user, serverMatch[1]); if (!server) return json(res, 404, { error: 'Servidor não encontrado.' }); return json(res, 200, { server: decorateServer(server, user), members: database.memberships.filter(m => m.serverId === server.id).map(m => publicUser(database.users.find(item => item.id === m.userId))) }); }
    if (serverMatch && req.method === 'POST') { const server = serverForUser(user, serverMatch[1]); if (!server || server.ownerId !== user.id) return json(res, 403, { error: 'Somente o dono pode criar canais.' }); const input = await body(req); const channel = { id: id(), serverId: server.id, name: String(input.name || 'novo-canal').trim().toLowerCase().replace(/\s+/g, '-'), type: input.type === 'voice' ? 'voice' : 'text', topic: input.topic || '', position: database.channels.filter(c => c.serverId === server.id).length, createdAt: now() }; database.channels.push(channel); await saveDatabase(); return json(res, 201, { channel }); }
    if (channelRootMatch && req.method === 'DELETE') { const channel = channelForUser(user, channelRootMatch[1]); const server = channel && database.servers.find(item => item.id === channel.serverId); if (!channel || !server || server.ownerId !== user.id) return json(res, 403, { error: 'Sem permissão.' }); database.channels = database.channels.filter(item => item.id !== channel.id); database.messages = database.messages.filter(item => item.channelId !== channel.id); await saveDatabase(); return json(res, 200, { ok: true }); }
    if (channelMatch && req.method === 'GET') { const channel = channelForUser(user, channelMatch[1]); if (!channel) return json(res, 404, { error: 'Canal não encontrado.' }); const limit = Math.min(Number(url.searchParams.get('limit') || 100), 200); return json(res, 200, { messages: database.messages.filter(message => message.channelId === channel.id).slice(-limit).map(decorateMessage) }); }
    if (channelMatch && req.method === 'POST') { const channel = channelForUser(user, channelMatch[1]); const input = await body(req); const content = String(input.content || '').trim(); if (!channel || !content || content.length > 4000) return json(res, 400, { error: 'Mensagem inválida.' }); const message = { id: id(), channelId: channel.id, authorId: user.id, content, createdAt: now(), editedAt: null }; database.messages.push(message); await saveDatabase(); const output = decorateMessage(message); broadcast(channel.id, { type: 'message.created', message: output }); return json(res, 201, { message: output }); }
    return json(res, 404, { error: 'Rota não encontrada.' });
  } catch (error) { console.error(error); return json(res, 500, { error: 'Erro interno do servidor.' }); }
}

await loadDatabase();
const server = http.createServer(handler);
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (socket, req) => {
  const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token'); const userId = sessions.get(token); if (!userId) return socket.close(1008, 'Unauthorized');
  sockets.set(userId, socket);
  socket.on('message', raw => {
    try {
      const event = JSON.parse(raw.toString());
      if (event.type === 'voice.join' || event.type === 'voice.leave') {
        const channel = database.channels.find(item => item.id === event.channelId && item.type === 'voice');
        if (!channel || !serverForUser(database.users.find(user => user.id === userId), channel.serverId)) return;
        if (!voiceRooms.has(channel.id)) voiceRooms.set(channel.id, new Map());
        const room = voiceRooms.get(channel.id);
        if (event.type === 'voice.join') room.set(userId, true); else room.delete(userId);
        broadcastVoice(channel.id, { type: 'voice.participants', channelId: channel.id, participants: voiceParticipants(channel.id) });
        if (event.type === 'voice.leave' && room.size === 0) voiceRooms.delete(channel.id);
      } else if (['voice.offer', 'voice.answer', 'voice.ice'].includes(event.type)) {
        const target = sockets.get(event.targetUserId); if (target?.readyState === 1) target.send(JSON.stringify({ ...event, fromUserId: userId }));
      }
    } catch { /* ignore malformed realtime events */ }
  });
  socket.on('close', () => {
    if (sockets.get(userId) === socket) sockets.delete(userId);
    for (const [channelId, room] of voiceRooms) if (room.delete(userId)) { broadcastVoice(channelId, { type: 'voice.participants', channelId, participants: voiceParticipants(channelId) }); if (!room.size) voiceRooms.delete(channelId); }
  });
});
server.on('error', error => { if (error.code === 'EADDRINUSE') console.error(`A porta ${port} já está em uso. O Orbit continuará usando o servidor existente.`); else throw error; });
server.listen(port, () => console.log(`Orbit API em http://localhost:${port}`));
