export const PREMIUM_FRAME_ART = {
  "lunar-halo": "/cosmetics-optimized/frames/lunar-halo.png",
  "ember-crown": "/cosmetics-optimized/frames/ember-crown.png",
  "sakura-halo": "/cosmetics-optimized/frames/sakura-halo.png",
  "cyber-pulse": "/cosmetics-optimized/frames/cyber-pulse.png",
  "steel-wolf": "/cosmetics-optimized/frames/steel-wolf.png",
  "infernal-dragon": "/cosmetics-optimized/frames/infernal-dragon.png",
}

export const PREMIUM_FRAME_MOTION = Object.fromEntries(
  Object.keys(PREMIUM_FRAME_ART).map(id => [id, "/cosmetics-animated/frames/" + id + ".sprite.webp?v=5"]),
)

export const PREMIUM_OVERLAY_ART = {
  "lunar-orbit": "/cosmetics-optimized/overlays/lunar-orbit.png",
  "gothic-bloom": "/cosmetics-optimized/overlays/gothic-bloom.png",
  "holo-circuit": "/cosmetics-optimized/overlays/holo-circuit.png",
  "sakura-shrine": "/cosmetics-optimized/overlays/sakura-shrine.png",
  "steel-wolf": "/cosmetics-optimized/overlays/steel-wolf.png",
  "infernal-dragon": "/cosmetics-optimized/overlays/infernal-dragon.png",
}

export const PREMIUM_OVERLAY_MOTION = Object.fromEntries(
  Object.keys(PREMIUM_OVERLAY_ART).map(id => [id, "/cosmetics-animated/overlays/" + id + ".sprite.webp?v=5"]),
)

export const PREMIUM_BANNER_IDS = new Set([
  "celestial-tide", "crimson-eclipse", "sakura-dawn",
  "neon-pulse", "steel-wolf", "infernal-dragon",
])

export const PREMIUM_BANNER_MOTION = Object.fromEntries(
  [...PREMIUM_BANNER_IDS].map(id => [id, "/cosmetics-animated/banners/" + id + ".sprite.webp?v=5"]),
)

export function premiumCosmetic(field, value) {
  if (field === "avatarFrame") return Boolean(PREMIUM_FRAME_ART[value])
  if (field === "profileOverlay") return Boolean(PREMIUM_OVERLAY_ART[value])
  if (field === "bannerPreset") return PREMIUM_BANNER_IDS.has(value)
  return false
}
