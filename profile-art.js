const PROFILE_ART_BASE = "/profile-art/";
const DISCORD_PROFILE_EFFECT_REFERENCE =
  "https://cdn.discordapp.com/media/v1/collectibles-shop/84168a5adc7db3805121683b85f398b21ebfd9e0396bc9a2bbf70591acb482fb";

// O quarto campo registra o formato real confirmado pelo MIME + assinatura
// interna. Os primeiros 15 itens usam a mídia do detalhe, nunca a capa estática.
export const PROFILE_ART_EFFECTS = [
  ["none", "Sem efeito", null, "none"],
  ["discord-espreitadores", "Espreitadores", DISCORD_PROFILE_EFFECT_REFERENCE, "apng"],
  ["trapped-souls", "Almas Aprisionadas", "https://cdn.discordapp.com/media/v1/collectibles-shop/3b74ba84c8941ad0d91afafd00d169b8124cd2956fcaa7fda3b784a6edafcba6", "apng"],
  ["macabre-frame", "Moldura Macabra", "macabre-frame.png", "apng"],
  ["shattered-wings", "Asas Estilhaçadas", "https://cdn.discordapp.com/media/v1/collectibles-shop/13e64b0456243ed81ae809a507d980cadf31d1b44848bd2c89d3c511604b25ff", "apng"],
  ["nevermore-midnight", "Nunca Mais (Meia-noite)", "https://cdn.discordapp.com/assets/content/6093a8e844ec5bc6b796ad5f31063fdbd321dc525c49ff980fb123f4ff603244", "apng"],
  ["whispering-rose", "Rosa Sussurrante", "https://cdn.discordapp.com/media/v1/collectibles-shop/f6798f7dce84fed42daa90be43d3e5852e96baf9de60022065116d3ca137b096", "apng"],
  ["mothman", "Homem-Mariposa", "https://cdn.discordapp.com/media/v1/collectibles-shop/1f2b91c50cc613ac683138f81c4fd6636445246275d0a43be220105b7426dc37", "apng"],
  ["midnight-howl", "Uivo da Meia-noite", "https://cdn.discordapp.com/media/v1/collectibles-shop/c8eda0d8533d69a251d780152bbfe6bac4fbbaab48be155a7c7dbebe8d74ed05", "apng"],
  ["jersey-devil", "Demônio de Jersey", "https://cdn.discordapp.com/media/v1/collectibles-shop/4d6f618dbe94a45857e73fd2f66050d91e492bc16494e0bdc2786d545d34b40a", "apng"],
  ["always-watching", "Sempre de Olho", "https://cdn.discordapp.com/media/v1/collectibles-shop/4394a572d2d2b1eddbc253c6c77e3725ea55a379ace4a998267afe37b2fe352b", "apng"],
  ["nevermore-white", "Nunca Mais (Branco)", "https://cdn.discordapp.com/assets/content/c63fef5bf0e775acdf282856277d09f8992e2ac812a61abeca218d5164dad09d", "apng"],
  ["night-bloom-basic", "Damas-da-noite (Básico)", "https://cdn.discordapp.com/media/v1/collectibles-shop/bbd175b29de9b89e9bb88f5e1f690033a7112be874c57e7d7aed06c9db80a606", "apng"],
  ["lets-play", "Vamos Brincar", "https://cdn.discordapp.com/media/v1/collectibles-shop/84168a5adc7db3805121683b85f398b21ebfd9e0396bc9a2bbf70591acb482fb", "apng"],
  ["dark-roses-black", "Rosas Sombrias (Preto)", "https://cdn.discordapp.com/assets/content/d0d1bcd19aa85c9a61436790216d90421a481336f07335859ee9ae4d184184e2", "apng"],
  ["hello-kitty", "Hello Kitty", "https://cdn.discordapp.com/media/v1/collectibles-shop/22c28cdfaab06dbb57914448ef7318ac3b59a083697b68c69f2030dfa828558c", "apng"],
  ["nevermore-crimson", "Nunca Mais (Carmesim)", "https://cdn.discordapp.com/assets/content/e306e4ac3b1fa6bd141077675f38a4e587b06b7cacf1c1f6df9ab903aa2738e8", "apng"],
  ["mermaid-bubbles", "Bolhas de Sereia", "https://cdn.discordapp.com/media/v1/collectibles-shop/d3809919c161a030bc9cc3149b4cbd227bc679a21ac1c4ac086fc1d7d97350b0", "apng"],
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

