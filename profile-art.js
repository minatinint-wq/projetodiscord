const PROFILE_ART_BASE = "/profile-art/";

// Somente arquivos cuja animação foi confirmada pelo chunk acTL do APNG.
// O catálogo é separado de nameplates: estas artes cobrem o cartão de perfil.
export const PROFILE_ART_EFFECTS = [
  ["none", "Sem efeito", null],
  ["trapped-souls", "Almas Aprisionadas", "trapped-souls.png"],
  ["macabre-frame", "Moldura Macabra", "macabre-frame.png"],
];

export const PROFILE_ART_IDS = new Set(PROFILE_ART_EFFECTS.map(([id]) => id));

export function profileArtSrc(id) {
  const item = PROFILE_ART_EFFECTS.find(([value]) => value === id);
  return item?.[2] ? PROFILE_ART_BASE + item[2] : null;
}

