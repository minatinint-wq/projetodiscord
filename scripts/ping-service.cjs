(async () => {
const rawBaseUrl = process.env.SESH_PUBLIC_URL;

if (!rawBaseUrl) {
  console.error("SESH_PUBLIC_URL não foi definida.");
  process.exit(1);
}

let target;
try {
  target = new URL("/api/health", rawBaseUrl);
} catch {
  console.error("SESH_PUBLIC_URL precisa ser uma URL pública válida.");
  process.exit(1);
}

if (target.protocol !== "https:" && target.protocol !== "http:") {
  console.error("SESH_PUBLIC_URL deve usar HTTP ou HTTPS.");
  process.exit(1);
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15_000);

try {
  const response = await fetch(target, {
    headers: { "user-agent": "Sesh-Render-Heartbeat/1.0" },
    signal: controller.signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  console.log(`Sesh health ping OK: ${target.origin}`);
} catch (error) {
  console.error(`Sesh health ping failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
})();
