import { REMOTE_AVATAR_DECORATIONS } from "../avatar-decorations"

// Todas as molduras fazem parte do pacote público. Uma CDN própria pode
// substituí-las no build, mas nunca usamos uma origem de terceiros como
// fallback: isso deixava o catálogo cheio de opções vazias.
const REMOTE_FRAME_BASE = String(import.meta.env.VITE_AVATAR_DECORATION_CDN || "/api/avatar-decorations/").replace(/\/?$/, "/")

export const PREMIUM_FRAME_ART = {
  ...Object.fromEntries(REMOTE_AVATAR_DECORATIONS.map(([id]) => [id, REMOTE_FRAME_BASE + id + ".png"])),
  "snowglobe": "/cosmetics-animated/frames/snowglobe.png?v=7",
  "fire": "/cosmetics-animated/frames/fire.png?v=7",
  "glitch": "/cosmetics-animated/frames/glitch.png?v=7",
}

export const PREMIUM_FRAME_APNG = new Set(Object.keys(PREMIUM_FRAME_ART))
export const PREMIUM_FRAME_MOTION = {}

export const PREMIUM_OVERLAY_ART = {
  "lunar-orbit": "/cosmetics-optimized/overlays/lunar-orbit.png",
  "gothic-bloom": "/cosmetics-optimized/overlays/gothic-bloom.png",
  "holo-circuit": "/cosmetics-optimized/overlays/holo-circuit.png",
  "sakura-shrine": "/cosmetics-optimized/overlays/sakura-shrine.png",
  "steel-wolf": "/cosmetics-optimized/overlays/steel-wolf.png",
  "infernal-dragon": "/cosmetics-optimized/overlays/infernal-dragon.png",
}

export const PREMIUM_OVERLAY_MOTION = Object.fromEntries(
  Object.keys(PREMIUM_OVERLAY_ART).map(id => [id, "/cosmetics-animated/overlays/" + id + ".sprite.webp?v=6"]),
)

export const PREMIUM_BANNER_IDS = new Set([
  "celestial-tide", "crimson-eclipse", "sakura-dawn",
  "neon-pulse", "steel-wolf", "infernal-dragon",
])

export const PREMIUM_BANNER_MOTION = Object.fromEntries(
  [...PREMIUM_BANNER_IDS].map(id => [id, "/cosmetics-animated/banners/" + id + ".sprite.webp?v=6"]),
)

export function premiumCosmetic(field, value) {
  if (field === "avatarFrame") return Boolean(PREMIUM_FRAME_ART[value])
  if (field === "profileOverlay") return Boolean(PREMIUM_OVERLAY_ART[value])
  if (field === "bannerPreset") return PREMIUM_BANNER_IDS.has(value)
  if (field === "nameEffect") return value !== "solid"
  return false
}
