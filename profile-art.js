const PROFILE_ART_BASE = "/profile-art/";
const DISCORD_PROFILE_EFFECT_REFERENCE =
  "https://cdn.discordapp.com/media/v1/collectibles-shop/84168a5adc7db3805121683b85f398b21ebfd9e0396bc9a2bbf70591acb482fb";

// Somente arquivos cuja animação foi confirmada pelo chunk acTL do APNG.
// O catálogo é separado de nameplates: estas artes cobrem o cartão de perfil.
export const PROFILE_ART_EFFECTS = [
  ["none", "Sem efeito", null],
  ["discord-reference-test", "Referência externa (teste)", DISCORD_PROFILE_EFFECT_REFERENCE],
  ["trapped-souls", "Almas Aprisionadas", "trapped-souls.png"],
  ["macabre-frame", "Moldura Macabra", "macabre-frame.png"],
];

export const PROFILE_ART_IDS = new Set(PROFILE_ART_EFFECTS.map(([id]) => id));

export function profileArtSrc(id) {
  const item = PROFILE_ART_EFFECTS.find(([value]) => value === id);
  if (!item?.[2]) return null;
  return /^https:\/\//i.test(item[2]) ? item[2] : PROFILE_ART_BASE + item[2];
}

