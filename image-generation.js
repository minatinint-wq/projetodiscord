const COMMAND_PATTERN = /^\/(image|imagensfw)\s+"([^"\r\n]{1,600})"\s*$/i;
const COMMAND_PREFIX_PATTERN = /^\/(?:image|imagensfw)\b/i;

const normalizePrompt = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const ADULT_WEIGHTS = new Map([
  ["nsfw", 3], ["nude", 3], ["nudes", 3], ["nudity", 3], ["nua", 3], ["nu", 2],
  ["naked", 3], ["porn", 4], ["porno", 4], ["pornografico", 4], ["explicit", 2],
  ["explicito", 2], ["sex", 3], ["sexo", 3], ["sexual", 3], ["erotic", 2],
  ["erotico", 2], ["lingerie", 1], ["fetish", 2], ["fetiche", 2], ["topless", 3],
  ["nsfl", 3], ["gore", 3], ["nua", 3], ["nudez", 3], ["pelada", 3], ["pelado", 3],
]);
const MINOR_TERMS = new Set([
  "child", "children", "kid", "kids", "minor", "underage", "teen", "teenager",
  "crianca", "criancas", "menor", "menores", "adolescente", "adolescentes", "infantil",
]);
const NON_CONSENSUAL_TERMS = new Set([
  "deepfake", "revenge porn", "sem consentimento", "nonconsensual", "non-consensual",
  "celebrity nude", "famosa nua", "famoso nu",
]);
const EXPLICIT_SEXUAL_TERMS = new Set([
  "porn", "porno", "pornografico", "explicit sex", "sexo explicito", "intercourse",
  "penetration", "penetracao", "blowjob", "oral sex", "sexo oral", "anal sex",
  "sexo anal", "masturbation", "masturbacao", "handjob", "cumshot", "ejaculation", "ejaculacao",
]);

export function parseImageCommand(content) {
  const value = String(content || "").trim();
  const match = value.match(COMMAND_PATTERN);
  if (match) return {
    command: match[1].toLowerCase(),
    prompt: match[2].trim(),
    nsfw: match[1].toLowerCase() === "imagensfw",
  };
  return COMMAND_PREFIX_PATTERN.test(value) ? { invalid: true } : null;
}

// Classificador linear local e leve. Ele apenas separa a rota comum da rota
// NSFW; a política definitiva continua sendo aplicada pelo provedor escolhido.
export function classifyImagePrompt(prompt) {
  const normalized = normalizePrompt(prompt);
  const words = normalized.match(/[a-z0-9-]+/g) || [];
  let adultScore = 0;
  for (const word of words) adultScore += ADULT_WEIGHTS.get(word) || 0;
  const mentionsMinor = words.some((word) => MINOR_TERMS.has(word));
  const mentionsNonConsensual = [...NON_CONSENSUAL_TERMS].some((term) => normalized.includes(term));
  const explicitSexual = [...EXPLICIT_SEXUAL_TERMS].some((term) => normalized.includes(term));
  return {
    adult: adultScore >= 2,
    prohibited: explicitSexual || mentionsNonConsensual || (mentionsMinor && adultScore >= 1),
    score: adultScore,
  };
}

const envValue = (env, name) => String(env[name] || "").trim();

function dataUrlFromBase64(base64, mime = "image/png") {
  const clean = String(base64 || "").replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
  if (!/^[a-z0-9+/]+={0,2}$/i.test(clean)) throw new Error("A API retornou uma imagem inválida.");
  const bytes = Buffer.from(clean, "base64");
  if (!bytes.length || bytes.length > 3 * 1024 * 1024) throw new Error("A imagem gerada excedeu 3 MB.");
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function responseToDataUrl(response, timeoutSignal) {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    const error = new Error(`Provedor de imagem respondeu ${response.status}${detail ? `: ${detail}` : ""}`);
    error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw error;
  }
  const contentType = String(response.headers.get("content-type") || "").split(";")[0].toLowerCase();
  if (contentType.startsWith("image/")) {
    const bytes = Buffer.from(await response.arrayBuffer());
    return dataUrlFromBase64(bytes.toString("base64"), contentType);
  }
  const payload = await response.json();
  const inline = payload?.data?.[0]?.b64_json
    || payload?.images?.[0]?.b64_json
    || payload?.images?.[0]?.base64
    || payload?.image
    || payload?.output?.[0]?.image
    || payload?.result?.image;
  if (inline) return dataUrlFromBase64(inline, payload?.data?.[0]?.mime_type || "image/png");
  const remoteUrl = payload?.data?.[0]?.url || payload?.images?.[0]?.url || payload?.output?.[0]?.url || payload?.url;
  if (!remoteUrl || !/^https:\/\//i.test(remoteUrl)) throw new Error("A API não retornou uma imagem reconhecida.");
  const imageResponse = await fetch(remoteUrl, { signal: timeoutSignal });
  return responseToDataUrl(imageResponse, timeoutSignal);
}

async function callJsonImageProvider({ name, url, token, model, prompt, signal }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt, ...(model ? { model } : {}) }),
    signal,
  });
  return { dataUrl: await responseToDataUrl(response, signal), provider: name };
}

async function callHuggingFaceSpace({ prompt, env, signal }) {
  const baseUrl = envValue(env, "NSFW_HF_SPACE_URL").replace(/\/$/, "");
  if (!baseUrl) return null;
  if (!/^https:\/\/[a-z0-9-]+\.hf\.space$/i.test(baseUrl))
    throw new Error("NSFW_HF_SPACE_URL precisa apontar para um domínio HTTPS .hf.space.");
  const apiName = envValue(env, "NSFW_HF_API_NAME") || "infer";
  if (!/^[a-z0-9_-]{1,80}$/i.test(apiName)) throw new Error("NSFW_HF_API_NAME inválido.");
  const token = envValue(env, "HF_TOKEN");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const width = Math.max(256, Math.min(Number(envValue(env, "NSFW_IMAGE_WIDTH")) || 768, 1024));
  const height = Math.max(256, Math.min(Number(envValue(env, "NSFW_IMAGE_HEIGHT")) || 768, 1024));
  const steps = Math.max(1, Math.min(Number(envValue(env, "NSFW_IMAGE_STEPS")) || 4, 12));
  const submit = await fetch(`${baseUrl}/gradio_api/call/${apiName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: [prompt, 0, true, width, height, steps] }),
    signal,
  });
  if (!submit.ok) return { dataUrl: await responseToDataUrl(submit, signal), provider: "huggingface-zerogpu" };
  const job = await submit.json();
  if (!job?.event_id) throw new Error("O Space não retornou um identificador de geração.");
  const events = await fetch(`${baseUrl}/gradio_api/call/${apiName}/${encodeURIComponent(job.event_id)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  });
  if (!events.ok) return { dataUrl: await responseToDataUrl(events, signal), provider: "huggingface-zerogpu" };
  const stream = await events.text();
  const values = stream.split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => {
      try { return JSON.parse(line.slice(5).trim()); } catch { return null; }
    })
    .filter(Boolean);
  const file = values.findLast((value) => Array.isArray(value) && value[0]?.url)?.[0];
  if (!file?.url) throw new Error("O Space terminou sem retornar uma imagem.");
  const imageUrl = new URL(file.url);
  if (imageUrl.protocol !== "https:" || !(imageUrl.hostname.endsWith(".hf.space") || imageUrl.hostname.endsWith("huggingface.co")))
    throw new Error("O Space retornou uma URL de imagem inesperada.");
  const imageResponse = await fetch(imageUrl, { signal });
  return { dataUrl: await responseToDataUrl(imageResponse, signal), provider: "huggingface-zerogpu" };
}

async function callCloudflare({ prompt, env, signal }) {
  const accountId = envValue(env, "CLOUDFLARE_ACCOUNT_ID");
  const token = envValue(env, "CLOUDFLARE_API_TOKEN");
  if (!accountId || !token) return null;
  const model = envValue(env, "CLOUDFLARE_IMAGE_MODEL") || "@cf/bytedance/stable-diffusion-xl-lightning";
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  return { dataUrl: await responseToDataUrl(response, signal), provider: "cloudflare" };
}

async function callGemini({ prompt, env, signal }) {
  const key = envValue(env, "GEMINI_API_KEY");
  if (!key) return null;
  const model = envValue(env, "GEMINI_IMAGE_MODEL") || "gemini-3.1-flash-lite-image";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
    signal,
  });
  if (!response.ok) {
    const error = new Error(`Gemini respondeu ${response.status}: ${(await response.text()).slice(0, 300)}`);
    error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw error;
  }
  const payload = await response.json();
  const part = payload?.candidates?.flatMap((candidate) => candidate?.content?.parts || [])
    .find((item) => item?.inlineData?.data || item?.inline_data?.data);
  const inline = part?.inlineData || part?.inline_data;
  if (!inline?.data) throw new Error("O Gemini não retornou uma imagem.");
  return { dataUrl: dataUrlFromBase64(inline.data, inline.mimeType || inline.mime_type || "image/png"), provider: "gemini" };
}

function customProvider(prefix, env, fallbackName) {
  const url = envValue(env, `${prefix}_API_URL`);
  if (!url) return null;
  return {
    name: envValue(env, `${prefix}_PROVIDER_NAME`) || fallbackName,
    url,
    token: envValue(env, `${prefix}_API_TOKEN`),
    model: envValue(env, `${prefix}_MODEL`),
  };
}

export async function generateImage({ prompt, nsfw = false, env = process.env }) {
  const timeoutMs = Math.max(5_000, Math.min(Number(envValue(env, "IMAGE_GENERATION_TIMEOUT_MS")) || 55_000, 120_000));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    if (nsfw) {
      const huggingFace = await callHuggingFaceSpace({ prompt, env, signal: controller.signal });
      if (huggingFace) return huggingFace;
      const provider = customProvider("NSFW_IMAGE", env, "nsfw-separate");
      if (!provider) {
        const error = new Error("A API separada de /imagensfw ainda não foi configurada.");
        error.status = 503;
        throw error;
      }
      return await callJsonImageProvider({ ...provider, prompt, signal: controller.signal });
    }

    const attempts = [];
    const cloudflareReady = envValue(env, "CLOUDFLARE_ACCOUNT_ID") && envValue(env, "CLOUDFLARE_API_TOKEN");
    if (cloudflareReady) attempts.push(() => callCloudflare({ prompt, env, signal: controller.signal }));
    const nvidia = customProvider("NVIDIA_IMAGE", env, "nvidia");
    if (nvidia) attempts.push(() => callJsonImageProvider({ ...nvidia, prompt, signal: controller.signal }));
    if (envValue(env, "GEMINI_API_KEY")) attempts.push(() => callGemini({ prompt, env, signal: controller.signal }));
    const normal = customProvider("NORMAL_IMAGE", env, "normal-custom");
    if (normal) attempts.push(() => callJsonImageProvider({ ...normal, prompt, signal: controller.signal }));
    if (!attempts.length) {
      const error = new Error("Configure ao menos um provedor para o comando /image.");
      error.status = 503;
      throw error;
    }

    let lastError;
    for (const attempt of attempts) {
      try {
        const result = await attempt();
        if (result) return result;
      } catch (error) {
        lastError = error;
        if (!error.retryable) throw error;
      }
    }
    throw lastError || new Error("Nenhum provedor de imagem respondeu.");
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("A geração da imagem demorou demais. Tente novamente.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
