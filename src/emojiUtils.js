// Utilidades puras (sem JSX) para renderizar emojis do chat com a mesma
// arte Apple do seletor, em vez do glifo nativo do sistema (que no
// Windows/Segoe UI fica apagado). Usado por EmojiText.jsx e EmojiArtwork.jsx.
export const APPLE_EMOJI_CDN =
  "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/";

// Formato "unified" do emoji-datasource/emoji-picker-react: code points em
// hex minúsculo separados por "-", com zero-padding (ex.: "0023-fe0f-20e3").
export function emojiToUnified(emoji) {
  return Array.from(String(emoji || ""))
    .map((character) => character.codePointAt(0).toString(16).padStart(4, "0"))
    .join("-");
}

const REGIONAL_INDICATOR = /[\u{1F1E6}-\u{1F1FF}]/u;

// Verdadeiro quando o cluster grafêmico deve virar imagem Apple:
// pictográficos (inclui ZWJ, tons de pele e VS16), pares de bandeira,
// keycaps (# * 0-9) e ©/® com seletor de emoji.
export function isEmojiCluster(cluster) {
  if (!cluster) return false;
  if (/^[#*0-9]\uFE0F?\u20E3$/u.test(cluster)) return true;
  if (/^[\u00A9\u00AE]\uFE0F?$/u.test(cluster)) return true;
  if (
    cluster.length === 4 &&
    REGIONAL_INDICATOR.test(cluster[0] + cluster[1]) &&
    REGIONAL_INDICATOR.test(cluster[2] + cluster[3])
  )
    return true;
  return /\p{Extended_Pictographic}/u.test(cluster);
}

let segmenter = null;
export function graphemes(text) {
  const value = String(text || "");
  try {
    segmenter =
      segmenter || new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(value), (entry) => entry.segment);
  } catch {
    return Array.from(value);
  }
}

// Divide o texto em trechos { type: "text" | "emoji", value }, agrupando
// caracteres comuns vizinhos para gerar menos nós React.
export function splitEmojiParts(text) {
  const parts = [];
  let buffer = "";
  const flush = () => {
    if (buffer) {
      parts.push({ type: "text", value: buffer });
      buffer = "";
    }
  };
  for (const cluster of graphemes(text)) {
    if (isEmojiCluster(cluster)) {
      flush();
      parts.push({ type: "emoji", value: cluster });
    } else {
      buffer += cluster;
    }
  }
  flush();
  return parts;
}
