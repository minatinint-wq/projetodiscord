import { REMOTE_AVATAR_DECORATIONS } from "./avatar-decorations.js";

export const PROFILE_EFFECTS = [
 ["none","Sem efeito"],["sparkles","Estrelas"],["glow","Luz suave"],["embers","Brasas e fumaça"],
 ["smoke","Fumaça cinematográfica"],["flames","Chamas"],["blue_fire","Fogo azul"],["ash","Cinzas ao vento"],
 ["aurora","Aurora boreal"],["confetti","Confete"],["hearts","Corações"],["cosmic","Cosmos"],
 ["lightning","Tempestade"],["fireflies","Vagalumes"],["sakura","Pétalas de cerejeira"],
 ["snow","Neve"],["matrix","Chuva digital"],["bubbles","Bolhas"],["prism","Prisma"],
 ["meteors","Meteoros"],["butterflies","Borboletas"],["diamonds","Diamantes"],
 ["neon_rain","Chuva neon"],["stardust","Poeira estelar"],["eclipse","Eclipse astral"],
 ["moon_petals","Pétalas lunares"],["glitch_scan","Varredura glitch"],["crystal_shards","Fragmentos de cristal"],
 ["void_rifts","Fendas do vazio"],["golden_runes","Runas douradas"],["ocean_caustics","Reflexos oceânicos"],
 ["rose_storm","Tempestade de rosas"],["spirit_orbs","Orbes espirituais"],["holo_stream","Fluxo holográfico"],
 ["shadow_tendrils","Sombras vivas"],["comet_trails","Rastros de cometa"],["enchanted_leaves","Folhas encantadas"],
 ["arcane_frost","Geada arcana"],
];
export const AVATAR_FRAMES = [
 ["none","Sem moldura"],["snowglobe","Globo de neve"],["fire","Fogo"],["glitch","Glitch"],
 ...REMOTE_AVATAR_DECORATIONS,
];
export const PROFILE_OVERLAYS = [
 ["none","Sem sobreposição"],["lunar-orbit","Órbita lunar"],["gothic-bloom","Jardim gótico"],["holo-circuit","Circuito premium"],
 ["sakura-shrine","Santuário sakura"],["steel-wolf","Lobo de aço"],["infernal-dragon","Dragão infernal"],
];
export const PREMIUM_AVATAR_FRAMES = AVATAR_FRAMES.slice(1).map(([id]) => id);
export const PREMIUM_PROFILE_OVERLAYS = ["lunar-orbit","gothic-bloom","holo-circuit","sakura-shrine","steel-wolf","infernal-dragon"];
export const PREMIUM_BANNER_PRESETS = ["celestial-tide","crimson-eclipse","sakura-dawn","neon-pulse","steel-wolf","infernal-dragon"];
export const NAME_EFFECTS = [
 ["solid","Sólido"],["gradient","Degradê"],["neon","Neon"],["rgb","RGB"],["rainbow","Arco-íris"],
 ["pink_pulse","Rosa pulsante"],["blue_gradient","Azul degradê"],["aurora","Aurora"],
 ["holographic","Holográfico"],["glitch","Glitch"],["fire","Fogo"],["ice","Gelo"],
 ["starlight","Luz estelar"],["prism","Prisma"],["outline","Contorno"],["desenho","Desenho"],["pop","Pop"],["gummy","Gummy"],
 ["red_black_pulse","Vermelho · pulso preto"],["white_black_pulse","Branco · pulso preto"],
 ["dark_sweep","Onda escura"],["color_cycle","Cores alternadas"],["chromatic","Cromático"],
];
