const PROFILE_ART_BASE = "/profile-art/";

// O quarto campo registra o formato real confirmado pelo MIME + assinatura
// interna. Todos os itens abaixo usam a mídia do detalhe, nunca a capa estática.
export const PROFILE_ART_EFFECTS = [
  ["none", "Sem efeito", null, "none"],
  ["trapped-souls", "Almas Aprisionadas", "https://cdn.discordapp.com/media/v1/collectibles-shop/3b74ba84c8941ad0d91afafd00d169b8124cd2956fcaa7fda3b784a6edafcba6", "apng"],
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
  ["hellhound", "Cão dos Infernos", "https://cdn.discordapp.com/media/v1/collectibles-shop/db5a61d9fb5b447c626cd59cf00c45cc61e211b042c8d5397be5f17b4151c698", "apng"],
  ["darth-vader-arrival", "A Chegada de Darth Vader", "https://cdn.discordapp.com/assets/content/b8783a9afb22aceb21e80d6fe69cab3f2e62a286a9e0f7c042555813d2619014", "apng"],
  ["shooting-stars", "Estrelas Cadentes", "https://cdn.discordapp.com/media/v1/collectibles-shop/ad15541b7eeda933a14ff4246562087787aa9ed0ea9e1105dea784077514dd63", "apng"],
  ["red-dragon", "Dragão Vermelho", "https://cdn.discordapp.com/assets/content/6898a8357b824710c262b697192bc8240eb9280b5c2e2d86ed1f8401bd78cee9", "apng"],
  ["chills", "Arrepio", "https://cdn.discordapp.com/media/v1/collectibles-shop/8274a57f4d55d382e3ab04ea178d274456bc397a7f2846f07962de8e01593b68", "apng"],
  ["sakura-dreams", "Sonhos de Sakura", "https://cdn.discordapp.com/assets/content/4d89d846e27e98e767e31222a16adb13cdf0fa8e55431827fb728a38b230d229", "apng"],
  ["spider-man", "Homem-Aranha", "https://cdn.discordapp.com/media/v1/collectibles-shop/05d9543720cb0294728155de219d9bb440d72331e88de3dbc1dced6bd270e6fb", "apng"],
  ["mermaid-muse", "Musa Sereia", "https://cdn.discordapp.com/media/v1/collectibles-shop/4a07534b42b61eb73f91d791c1565b266b87944490e418ccac86701cb4b7e1a1", "apng"],
  ["la-llorona", "La Llorona", "https://cdn.discordapp.com/media/v1/collectibles-shop/1bbc69db6468dd93e7dc34414108dc3661f756f9c77adcf536e0cf2fb9c1f4f7", "apng"],
  ["sun-rays", "Raios Solares", "https://cdn.discordapp.com/media/v1/collectibles-shop/124a87da4f276710bc6f24a9990ef62f1f5e1d6a6c81237c3fa632dbf713aced", "apng"],
  ["sun-catchers", "Apanhadores de Sol", "https://cdn.discordapp.com/media/v1/collectibles-shop/728f0c927b5b50a012f73d81783e7814f9b5fea6d9aa4746ab2025081f968afe", "apng"],
  ["bonsai-eternity", "Eternidade do Bonsai", "https://cdn.discordapp.com/assets/content/00f5603ad5a4ebfa362eab5538be5d1d8dd0206f175beb876644da3877bdf827", "apng"],
  ["ink-and-steel", "De Tinta e Aço", "https://cdn.discordapp.com/assets/content/d8b2d19b35f02d107903a02b2cf28e37d69c664927f542559877cea6fafebe72", "apng"],
  ["cosmic-twilight-fuchsia", "Crepúsculo Cósmico (Fúcsia)", "https://cdn.discordapp.com/assets/content/0e6a81d88fa4b71f89989fd5138bbf847c1fe24055f97f24e4daab216b396437", "apng"],
  ["night-bloom-jackalope", "Damas-da-noite (Jackalope)", "https://cdn.discordapp.com/media/v1/collectibles-shop/7b9d0c8ce8287a2600543a1c65f872262e30a9eeed68936f01bef7e99c40f95b", "apng"],
  ["dancing-dolphins", "Golfinhos Dançantes", "https://cdn.discordapp.com/media/v1/collectibles-shop/b2c710c81e5cd692cbc84717028a9964fd4391d79171e9bdefdb04e61aafd96b", "apng"],
  ["dark-roses-twilight", "Rosas Sombrias (Penumbra)", "https://cdn.discordapp.com/assets/content/d842b47abc796bee36fbd46a7581f113d3f2d215e85b1628b94fc9dcd8d373da", "apng"],
  ["venom", "Venom", "https://cdn.discordapp.com/media/v1/collectibles-shop/c05f8668d881c19b4013d38003acdbf209528eec6f6cea67d5122476aa4d00b4", "apng"],
  ["autumn-foliage", "Folhagem de Outono", "https://cdn.discordapp.com/assets/content/011caa102d9a4e83949ced7b8f0323ef0d5ceedf1c90f61a48ac2c627f87dd26", "apng"],
  ["butterfly-refuge", "Refúgio das Borboletas", "https://cdn.discordapp.com/assets/content/2e87b6b9841c4779f86f2bbbfca8bb6628eae892c7c95c39ab340b312641b16d", "apng"],
  ["death-head-moth", "Mariposa-caveira", "https://cdn.discordapp.com/media/v1/collectibles-shop/cc1d801ab6767150f3450eb2003adab63e6ed9655ef67e19e9d09e91d3132743", "apng"],
  ["moonlight-crystals", "Cristais do Luar", "https://cdn.discordapp.com/assets/content/5231cca365b1d39335d55cabaf0f94c1892d7ccf1af302ebf809c138e2448039", "apng"],
  ["neon-splendor-ruby", "Brilho Neon (Rubi)", "https://cdn.discordapp.com/media/v1/collectibles-shop/0a034e447378eebf752642ebadf5fb5794973682f6592eeaf7a81f399f42152a", "apng"],
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

