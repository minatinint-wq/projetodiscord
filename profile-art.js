const PROFILE_ART_BASE = "/profile-art/";

// O quarto campo registra o formato real confirmado pelo MIME + assinatura
// interna. Todos os itens abaixo usam a mídia do detalhe, nunca a capa estática.
export const PROFILE_ART_EFFECTS = [
  ["none", "Sem efeito", null, "none"],
  ["rain", "Chuva", "rain.apng", "apng"],
  ["mao-sombria", "Mão sombria", "mao-sombria.apng", "apng"],
  ["estilhacos-brancos", "Estilhaços brancos", "estilhacos-brancos.apng", "apng"],
  ["codigo-neon", "Código neon", "codigo-neon.apng?v=2", "apng"],
  ["trapped-souls", "Almas Aprisionadas", "https://cdn.discordapp.com/media/v1/collectibles-shop/3b74ba84c8941ad0d91afafd00d169b8124cd2956fcaa7fda3b784a6edafcba6", "apng"],
  ["shattered-wings", "Asas Estilhaçadas", "https://cdn.discordapp.com/media/v1/collectibles-shop/13e64b0456243ed81ae809a507d980cadf31d1b44848bd2c89d3c511604b25ff", "apng"],
  ["nevermore-midnight", "Nunca Mais (Meia-noite)", "https://cdn.discordapp.com/assets/content/6093a8e844ec5bc6b796ad5f31063fdbd321dc525c49ff980fb123f4ff603244", "apng"],
  ["whispering-rose", "Rosa Sussurrante", "https://cdn.discordapp.com/media/v1/collectibles-shop/f6798f7dce84fed42daa90be43d3e5852e96baf9de60022065116d3ca137b096", "apng"],
  ["mothman", "Homem-Mariposa", [
    "https://cdn.discordapp.com/media/v1/collectibles-shop/018e9aacc0a05f90dd18b4851c7130041321d0dbdc5df32944d7d361d0e65794",
    "https://cdn.discordapp.com/media/v1/collectibles-shop/6141bed8d0353c9104a069af0c42dc80967c72a4061c018f7ace53c1f4a359ad",
    "https://cdn.discordapp.com/media/v1/collectibles-shop/88278b3768b7a4e2dc71af8f77c136b07169c7eafb0cc752969bb07ada33e112",
    "https://cdn.discordapp.com/media/v1/collectibles-shop/1f2b91c50cc613ac683138f81c4fd6636445246275d0a43be220105b7426dc37",
  ], "apng"],
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
  ["magic-hearts", "Corações Mágicos", "https://cdn.discordapp.com/assets/content/6f7444d87e28d7ce011398eee37f637c597d1cf1bad2e90580dbad8b6eba3ca4", "apng"],
  ["hallelujah-mountains", "Montanhas da Aleluia", "https://cdn.discordapp.com/assets/content/e1b8a19f2eb61f8e5331a05d8960f11805df76ec363bdc752c1a0c4764d48f63", "apng"],
  ["confectionery-challenge", "Desafio de Confeitaria", "https://cdn.discordapp.com/assets/content/be4ed5003cc22f4bbf43aa54fd60496f9305369073a24ef462f5f3da8a64fe3c", "apng"],
  ["hopeful-beginnings", "Começos Cheios de Esperança", "https://cdn.discordapp.com/assets/content/96113b6d1649b9cfaf75b2f71999e1f2d9f79cd24864fd1db246b6eaf608e307", "apng"],
  ["titan-vs-astro", "Titan vs. Astro", "https://cdn.discordapp.com/assets/content/6d1bee2c384ec2959fd405360cd4a7aa75d336b041fed455f2d2a8a639807a1a", "apng"],
  ["ekko-hoverboard", "Acrobacias no Aeroplanador do Ekko", "https://cdn.discordapp.com/assets/content/f6bc6d0ed774dbe2b1534ee5720dee70d8446a00fee037e4911e58393486fb6b", "apng"],
  ["zombie-slime-midnight", "Gosma de Zumbi (Meia-noite)", "https://cdn.discordapp.com/assets/content/2f52434264e92212f33da01803de9fc196058612cb0a165fb35bf0ea28adc43b", "apng"],
  ["drifting-bear", "Urso à Deriva", "https://cdn.discordapp.com/assets/content/eaf22c2a6a0f8c67583bce32099dad49d08bb3c88bcc39246e01f65143902a28", "apng"],
  ["sushimania", "Sushimania", "https://cdn.discordapp.com/assets/content/6c2414b14964302bbe3efacbb9bfe92e52cd6838743a3efdbb355ace3b953e99", "apng"],
  ["tiny-pancakes", "Panquequinhas", "https://cdn.discordapp.com/assets/content/5a68d8d62b6039b70e7e6fec7d26bff2aee02aa7af2a722a47235a07265903cc", "apng"],
  ["abundant-roses-red", "Rosas em Abundância (Vermelho)", [
    "https://cdn.discordapp.com/assets/content/bd610a27fcaf4b724f2bcfb1eb0b4ac134a72cc2865ea0ce4a4810b0adce1abb",
    "https://cdn.discordapp.com/assets/content/88c7274a44188ba96ea57d633d304dd51402f896a7f90db63912d1d3ca1ef6ed",
  ], "apng"],
  ["yoru-dimensional-rift", "Fenda Dimensional do Yoru", "https://cdn.discordapp.com/assets/content/92ceb8fdfbf0f13d0610d7423daee5577d50b7e5457dae42a8972981486ad655", "apng"],
];

export const PROFILE_ART_IDS = new Set(PROFILE_ART_EFFECTS.map(([id]) => id));

export function profileArtSources(id) {
  const item = PROFILE_ART_EFFECTS.find(([value]) => value === id);
  if (!item?.[2]) return [];
  const files = Array.isArray(item[2]) ? item[2] : [item[2]];
  return files.map((file) => /^https:\/\//i.test(file) ? file : PROFILE_ART_BASE + file);
}

export function profileArtSrc(id, variant = 0) {
  const sources = profileArtSources(id);
  if (!sources.length) return null;
  const index = Math.abs(Number.isFinite(variant) ? Math.trunc(variant) : 0) % sources.length;
  return sources[index];
}

export function profileArtVariantCount(id) {
  return profileArtSources(id).length;
}

export function profileArtFormat(id) {
  return PROFILE_ART_EFFECTS.find(([value]) => value === id)?.[3] || "unknown";
}

