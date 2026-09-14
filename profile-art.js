const PROFILE_ART_BASE = "/profile-art/";
const DISCORD_PROFILE_EFFECT_REFERENCE =
  "https://cdn.discordapp.com/media/v1/collectibles-shop/84168a5adc7db3805121683b85f398b21ebfd9e0396bc9a2bbf70591acb482fb";

// Catálogo coletado diretamente dos cartões da loja. O quarto campo registra o
// formato real confirmado pelo MIME + assinatura interna, sem confiar na URL.
// A maioria das prévias da loja é PNG estático; APNGs continuam animados no img.
export const PROFILE_ART_EFFECTS = [
  ["none", "Sem efeito", null, "none"],
  ["discord-espreitadores", "Espreitadores", DISCORD_PROFILE_EFFECT_REFERENCE, "apng"],
  ["trapped-souls", "Almas Aprisionadas (animado)", "trapped-souls.png", "apng"],
  ["macabre-frame", "Moldura Macabra", "macabre-frame.png", "apng"],
  ["shattered-wings", "Asas Estilhaçadas", "https://cdn.discordapp.com/media/v1/collectibles-shop/dc424970b232e08726c601206010cca8fb4e37b8124e4e15f24af32bb18742ba", "png"],
  ["nevermore-midnight", "Nunca Mais (Meia-noite)", "https://cdn.discordapp.com/assets/content/cabac17518f20cc7c642dbeec8f6cec45e98820c4e9b8a78cceb44412a3985e8", "png"],
  ["whispering-rose", "Rosa Sussurrante", "https://cdn.discordapp.com/media/v1/collectibles-shop/fa324b1c3c17941dd4edb3cbeedc41d288660aa7cae440e1e61fd54651d78055", "png"],
  ["mothman", "Homem-Mariposa", "https://cdn.discordapp.com/media/v1/collectibles-shop/88278b3768b7a4e2dc71af8f77c136b07169c7eafb0cc752969bb07ada33e112", "png"],
  ["midnight-howl", "Uivo da Meia-noite", "https://cdn.discordapp.com/media/v1/collectibles-shop/d54ed9347319264bb42a14757bbd19284570c98622162e1ac57ef4eac41a8204", "png"],
  ["jersey-devil", "Demônio de Jersey", "https://cdn.discordapp.com/media/v1/collectibles-shop/c630a6338341e384a575da9bf2571237ae6b7317f8e77d47216d28b25a58270b", "png"],
  ["always-watching", "Sempre de Olho", "https://cdn.discordapp.com/media/v1/collectibles-shop/44073352736ba9910fe5dfb0ca31125d985b281efd72cf19ba1bd9ed073e0df9", "png"],
  ["nevermore-white", "Nunca Mais (Branco)", "https://cdn.discordapp.com/assets/content/8396ce3a1df9dcee95c2f576f78b03f40d66f52f189dc1deb519f904e717dc0c", "png"],
  ["night-bloom-basic", "Damas-da-noite (Básico)", "https://cdn.discordapp.com/media/v1/collectibles-shop/5c86da4e65bd9a5a5c0f37ad559ec6637fde50a6782dc6800cb7ee88293676d0", "png"],
  ["lets-play", "Vamos Brincar", "https://cdn.discordapp.com/media/v1/collectibles-shop/120627a78de773d458668ba9dc5db233e94df7f70f321e3e2f752b63e4797a3a", "png"],
  ["dark-roses-black", "Rosas Sombrias (Preto)", "https://cdn.discordapp.com/assets/content/4d71e444e4288fa4d727b209622455074596560add27586e8cd3bdc292902fad", "png"],
  ["hello-kitty", "Hello Kitty", "https://cdn.discordapp.com/media/v1/collectibles-shop/80ee7cc461db7f7493816a03af3b03a620c8edc248f188f8b2913ffbf7266371", "png"],
  ["nevermore-crimson", "Nunca Mais (Carmesim)", "https://cdn.discordapp.com/assets/content/0922c837516e30b1635e171fb2bc450210e49334dd9623b58fbdda65d922e306", "png"],
  ["mermaid-bubbles", "Bolhas de Sereia", "https://cdn.discordapp.com/media/v1/collectibles-shop/cbcc272d92c12625b122c3ac045007cbf203f4bc03d5e5a18271d711066642ed", "png"],
  ["hellhound", "Cão dos Infernos", "https://cdn.discordapp.com/media/v1/collectibles-shop/ee63dbed7337a57ac139ae5bb16f4c35fe2092e5471193bff974d3a14672a664", "png"],
  ["darth-vader-arrival", "A Chegada de Darth Vader", "https://cdn.discordapp.com/assets/content/74e2a228eeb1d5539e158b3ff11ae6033bffe06ed65d1aa0b962baeb5f34d72b", "png"],
  ["shooting-stars", "Estrelas Cadentes", "https://cdn.discordapp.com/media/v1/collectibles-shop/9f77a88352e50a0e92fc7b55339be67080140ceb332ae92b307df2dc3d7fd0b8", "png"],
  ["red-dragon", "Dragão Vermelho", "https://cdn.discordapp.com/assets/content/4d4b146448f47711415a15db8988977a88860da9fb67d233e4e6a8972446337b", "png"],
  ["chills", "Arrepio", "https://cdn.discordapp.com/media/v1/collectibles-shop/b6f265ce5b8663ac063871c792f2f087a67d4670bc2010214f9ca65114b88f48", "png"],
  ["sakura-dreams", "Sonhos de Sakura", "https://cdn.discordapp.com/assets/content/7765f6bbd3a7e9e8c3e113a85b58887935bd0c9dd7947e8fde6ea953a6c5ab3c", "png"],
  ["spider-man", "Homem-Aranha", "https://cdn.discordapp.com/media/v1/collectibles-shop/ba0e0454f6c23edf081067357f72a1cf3629e4d59ffe14e1f33de40b96371d49", "png"],
  ["mermaid-muse", "Musa Sereia", "https://cdn.discordapp.com/media/v1/collectibles-shop/76bde72f5d4d168f04e97f1ecaf729e29fe0bc0904deb90b19dd18b9191accaa", "png"],
  ["la-llorona", "La Llorona", "https://cdn.discordapp.com/media/v1/collectibles-shop/daf7dc5e029a14dc6a1b5ae1bc000606d76cd212e2cb232e57f52baf66eda3e5", "png"],
  ["sun-rays", "Raios Solares", "https://cdn.discordapp.com/media/v1/collectibles-shop/ef28c67f6ee7c03f1115ec62c0e48458b18d26d0391dd4fa58ea8f724ccef64e", "png"],
  ["sun-catchers", "Apanhadores de Sol", "https://cdn.discordapp.com/media/v1/collectibles-shop/0f73a1d57c416e5bebc6575666c2f54fa19eb5b40334cbd911e6c321ac8d157c", "png"],
  ["bonsai-eternity", "Eternidade do Bonsai", "https://cdn.discordapp.com/assets/content/b119e66ca08831af34980952fadd6439f91b08ca8bdc0e76bb276254629705fd", "png"],
  ["ink-and-steel", "De Tinta e Aço", "https://cdn.discordapp.com/assets/content/2d3046033200f823557e43e2740ea3c47598c76c53781b46c0e102801c4547e1", "png"],
  ["cosmic-twilight-fuchsia", "Crepúsculo Cósmico (Fúcsia)", "https://cdn.discordapp.com/assets/content/5a49ca0504260af74fa9560656983d35fc07d6d3490bc56d2bbecea65eb454ac", "png"],
  ["night-bloom-jackalope", "Damas-da-noite (Jackalope)", "https://cdn.discordapp.com/media/v1/collectibles-shop/ed46943222a428a7a2c26fd78cc36f3a17f31cd9e6f30855422f016f45ef8189", "png"],
  ["dancing-dolphins", "Golfinhos Dançantes", "https://cdn.discordapp.com/media/v1/collectibles-shop/b2c710c81e5cd692cbc84717028a9964fd4391d79171e9bdefdb04e61aafd96b", "apng"],
  ["dark-roses-twilight", "Rosas Sombrias (Penumbra)", "https://cdn.discordapp.com/assets/content/14233991c960bc01e7008af735841d2733370316616c669f7a210c5f22f19eec", "png"],
  ["venom", "Venom", "https://cdn.discordapp.com/media/v1/collectibles-shop/d9edd2f8ed759e348497d49c5210fd7286ad2a58687b921bb0db68bbaf3b8ea8", "png"],
  ["autumn-foliage", "Folhagem de Outono", "https://cdn.discordapp.com/assets/content/3b3c3d380a95b310906d15d179f630461274bc2b203998deb53ddc3f22037d9b", "png"],
  ["butterfly-refuge", "Refúgio das Borboletas", "https://cdn.discordapp.com/assets/content/c388707e9e359262558a81a83b1c7309964da3e152782de73c5fb9c87d9fb2fc", "png"],
  ["death-head-moth", "Mariposa-caveira", "https://cdn.discordapp.com/media/v1/collectibles-shop/e00e481667db450acf22cfa733c7b1e998f3b08ac8eff6a26984ab0f3bb6a5d8", "png"],
  ["moonlight-crystals", "Cristais do Luar", "https://cdn.discordapp.com/assets/content/87e5b00fb1d16e92bab23770ecc78618317651df1b9d3ec6944c4e7f8c6ac3df", "png"],
];

export const PROFILE_ART_IDS = new Set(PROFILE_ART_EFFECTS.map(([id]) => id));

export function profileArtSrc(id) {
  const item = PROFILE_ART_EFFECTS.find(([value]) => value === id);
  if (!item?.[2]) return null;
  return /^https:\/\//i.test(item[2]) ? item[2] : PROFILE_ART_BASE + item[2];
}

export function profileArtFormat(id) {
  return PROFILE_ART_EFFECTS.find(([value]) => value === id)?.[3] || "unknown";
}

