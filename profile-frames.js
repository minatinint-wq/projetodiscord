const DISCORD_SHOP = "https://cdn.discordapp.com/media/v1/collectibles-shop/";

// Molduras de perfil coletadas do catálogo completo.
// A loja fornece a ordem de profundidade (front/back), a âncora (top/bottom)
// e a sangria de cada produto. Esses dados não podem ser inferidos pela
// proporção da imagem: há pares do mesmo tamanho com funções diferentes.
const ORDERS = {
  standard: [["front", "top"], ["front", "bottom"], ["back", "top"], ["back", "bottom"]],
  frontTopBottomBackTop: [["front", "top"], ["front", "bottom"], ["back", "top"]],
  frontTopBackTopBackBottom: [["front", "top"], ["back", "top"], ["back", "bottom"]],
  backTopFrontTopFrontBottom: [["back", "top"], ["front", "top"], ["front", "bottom"]],
  backBottomFrontTopFrontBottomBackTop: [["back", "bottom"], ["front", "top"], ["front", "bottom"], ["back", "top"]],
  frontPair: [["front", "top"], ["front", "bottom"]],
  frontPairBackBottom: [["front", "top"], ["front", "bottom"], ["back", "bottom"]],
  topPair: [["front", "top"], ["back", "top"]],
  topOnly: [["front", "top"]],
  backTopOnly: [["back", "top"]],
};

const DEFAULT_LAYOUT = {
  containerWidth: 1200,
  overflowHorizontal: 56,
  overflowTop: 304,
  overflowBottom: 212,
  order: "standard",
};

const FRAME_LAYOUTS = new Map();

const frame = (id, label, paths, options = {}) => {
  const sources = paths.map((path) => DISCORD_SHOP + path);
  const layout = { ...DEFAULT_LAYOUT, ...options };
  const order = ORDERS[layout.order] || ORDERS.standard;
  FRAME_LAYOUTS.set(id, {
    containerWidth: layout.containerWidth,
    overflowHorizontal: layout.overflowHorizontal,
    overflowTop: layout.overflowTop,
    overflowBottom: layout.overflowBottom,
    layers: sources.map((src, index) => {
      const [role = "front", edge = "top"] = order[index] || [];
      return { src, role, edge };
    }),
  });
  return [id, label, sources];
};

export const PROFILE_FRAMES = [
  ["none", "Sem moldura", []],
  frame("symbiote", "Simbionte", ["1536493354450288680/1536493443591708682/static", "1536493354450288680/1536493448750825562/static", "1536493354450288680/1536493453150658600/static", "1536493354450288680/1536493458490003548/static"]),
  frame("rose-filigree", "Filigrana de Rosas", ["1538992680552636548/1538992839197720769/static", "1538992680552636548/1538992843312464012/static", "1538992680552636548/1538992846814576751/static", "1538992680552636548/1538992850535059466/static"]),
  frame("total-concealment", "Ocultação Total", ["1531413285243719880/1533986938368036915/static", "1531413285243719880/1533986943057137715/static", "1531413285243719880/1533986948220321862/static"]),
  frame("dry-branches", "Galhos Secos", ["1541464541966114826/1541464621884510258/static", "1541464541966114826/1541464626057711706/static", "1541464541966114826/1541464629321011250/static", "1541464541966114826/1541464632957472842/static"], { overflowTop: 215, overflowBottom: 133 }),
  frame("moth-white", "Mariposa (Branco)", ["1517303399799062668/1524824219844739122/static", "1517303399799062668/1524824224559268011/static", "1517303399799062668/1524824229810278460/static"], { overflowTop: 298, overflowBottom: 107, order: "frontTopBottomBackTop" }),
  frame("meow-kitty-white", "Gatinho Miau Miau (Branco)", ["1491907428344795276/1522378688971411657/static", "1491907428344795276/1522378692112809994/static", "1491907428344795276/1522378695187238972/static", "1491907428344795276/1522378698207264809/static"], { overflowHorizontal: 54, overflowTop: 301, overflowBottom: 147 }),
  frame("night-bloom", "Damas-da-noite", ["1541464049919983667/1541464161576423504/static", "1541464049919983667/1541464165909012671/static", "1541464049919983667/1541464169302335608/static", "1541464049919983667/1541464173194518649/static"], { overflowHorizontal: 55, overflowTop: 303 }),
  frame("dark-roses-black", "Rosas Sombrias (Preto)", ["1511834130294247555/1515086606665646213/static", "1511834130294247555/1515086611896078477/static"], { overflowTop: 211, overflowBottom: 186, order: "frontPair" }),
  frame("fantasy-galaxy-white", "Galáxia Fantasiosa (Branco)", ["1524193380492509345/1526660358712852691/static", "1524193380492509345/1526660363071000666/static"], { overflowBottom: 0, order: "topPair" }),
  frame("bunny-sweetness", "Doçura de Coelhinho", ["1524191647854891039/1524192390502551724/static", "1524191647854891039/1524192394801713222/static"], { overflowTop: 126, overflowBottom: 116, order: "frontPair" }),
  frame("lord-of-dead-red", "Senhor dos Mortos (Vermelho)", ["1533925887098224730/1534992785206411324/static", "1533925887098224730/1534992798002974751/static", "1533925887098224730/1534992807885017249/static"], { overflowBottom: 148, order: "frontTopBackTopBackBottom" }),
  frame("celestial-chart", "Carta Celeste", ["1524190883036266636/1524191327024320522/static", "1524190883036266636/1524191337790836907/static", "1524190883036266636/1524191342538915931/static"], { overflowBottom: 127, order: "backTopFrontTopFrontBottom" }),
  frame("meow-kitty-black", "Gatinho Miau Miau (Preto)", ["1522378878083924051/1524824357199675523/static", "1522378878083924051/1524824361503166484/static", "1522378878083924051/1524824365282099231/static", "1522378878083924051/1524824369212424203/static"], { overflowHorizontal: 54, overflowTop: 301, overflowBottom: 147 }),
  frame("demonic-thorns", "Espinhos Demoníacos", ["1541462746032381982/1541463501657215026/static", "1541462746032381982/1541463505176109087/static"], { overflowTop: 270, overflowBottom: 0, order: "topPair" }),
  frame("ocean", "Oceano", ["1526698360080306276/1526698477919146044/static", "1526698360080306276/1526698483346706442/static", "1526698360080306276/1526698487780212849/static", "1526698360080306276/1526698492448211005/static"]),
  frame("fantasy-galaxy-blue", "Galáxia Fantasiosa (Azul)", ["1524193178586972441/1526660277838282893/static", "1524193178586972441/1526660281802031224/static"], { overflowBottom: 0, order: "topPair" }),
  frame("pearl-burst", "Estouro Perolado", ["1544103549892300830/1547368619091042364/static", "1544103549892300830/1547368622840746045/static", "1544103549892300830/1547368630142902282/static", "1544103549892300830/1547368633867571310/static"], { overflowTop: 190, overflowBottom: 159 }),
  frame("dark-roses-white", "Rosas Sombrias (Branco)", ["1511834131242287195/1515086653209841684/static", "1511834131242287195/1515086657794081029/static"], { overflowTop: 211, overflowBottom: 186, order: "frontPair" }),
  frame("fantasy-galaxy-pink", "Galáxia Fantasiosa (Rosa)", ["1524192423260061706/1526660211274944754/static", "1524192423260061706/1526660216026828950/static"], { overflowBottom: 0, order: "topPair" }),
  frame("lord-of-dead-blue", "Senhor dos Mortos (Azul)", ["1533925498961264871/1533925847021518939/static", "1533925498961264871/1533925851752825032/static", "1533925498961264871/1533925855338827867/static"], { overflowBottom: 148, order: "frontTopBackTopBackBottom" }),
  frame("strawberry-bunny", "Coelhinho de Morango", ["1526697977513509007/1526698280728133723/static", "1526697977513509007/1526698286248099932/static", "1526697977513509007/1526698290215784569/static", "1526697977513509007/1526698294841970698/static"]),
  frame("lofi-landscape", "Paisagem Lofi", ["1524193825130811604/1524193966818459790/static"], { overflowHorizontal: 0, overflowBottom: 0, order: "backTopOnly" }),
  frame("moth-pink", "Mariposa (Rosa)", ["1511908350324113478/1524824070691229817/static", "1511908350324113478/1524824076630364290/static", "1511908350324113478/1524824082325966848/static"], { overflowTop: 298, overflowBottom: 107, order: "frontTopBottomBackTop" }),
  frame("sakura-spring", "Primavera de Sakura", ["1491908830844424302/1511895595718148197/static", "1491908830844424302/1511895599232843937/static", "1491908830844424302/1511895603041407016/static", "1491908830844424302/1511895606392651979/static"]),
  frame("solar-crown", "Coroa Solar", ["1531413463623139328/1532536724981547221/static", "1531413463623139328/1532536729821511811/static"]),
  frame("dark-roses-twilight", "Rosas Sombrias (Penumbra)", ["1491910305603911881/1515086535480049714/static", "1491910305603911881/1515086540794237099/static"], { overflowTop: 211, overflowBottom: 186, order: "frontPair" }),
  frame("prismatic-outline-pink", "Contorno Prismático (Rosa)", ["1524512601827180624/1524557375024009436/static", "1524512601827180624/1524557380090593321/static", "1524512601827180624/1524557384922697981/static"], { overflowHorizontal: 38, overflowTop: 127, overflowBottom: 123, order: "backTopFrontTopFrontBottom" }),
  frame("neon-chaos-purple", "Caos Neon (Roxo)", ["1511869969921609874/1514424192471404596/static", "1511869969921609874/1514424195486842940/static", "1511869969921609874/1514424199001669695/static", "1511869969921609874/1514424202038345828/static"], { order: "backBottomFrontTopFrontBottomBackTop" }),
  frame("meow-kitty-orange", "Gatinho Miau Miau (Laranja)", ["1522380815538065549/1522381608047345756/static", "1522380815538065549/1522381611776348200/static", "1522380815538065549/1522381615484108914/static", "1522380815538065549/1522381620278067314/static"], { overflowHorizontal: 54, overflowTop: 301, overflowBottom: 147 }),
  frame("vengeance-orange", "Vingança (Laranja)", ["1507152063078072454/1514421773637259365/static", "1507152063078072454/1514421776967405728/static"], { overflowBottom: 0, order: "topPair" }),
  frame("prismatic-outline-blue", "Contorno Prismático (Azul)", ["1524512219298267187/1524512576686526606/static", "1524512219298267187/1524512580935352410/static", "1524512219298267187/1524512586375237712/static"], { overflowHorizontal: 38, overflowTop: 127, overflowBottom: 123, order: "backTopFrontTopFrontBottom" }),
  frame("spider-man", "Homem-Aranha", ["1536491679949922304/1536492376778870896/static", "1536491679949922304/1536492380520452238/static", "1536491679949922304/1536492384177618954/static", "1536491679949922304/1536492387927466055/static"]),
  frame("crystals-amethyst", "Cristais (Ametista)", ["1484726324580061191/1514422966870347837/static", "1484726324580061191/1514422970251083806/static"], { overflowBottom: 0, order: "topPair" }),
  frame("vengeance-pink", "Vingança (Rosa)", ["1484726324592640056/1514421385064087734/static", "1484726324592640056/1514421389044482159/static"], { overflowBottom: 0, order: "topPair" }),
  frame("retrofuturism", "Retrofuturismo", ["1489398661619384321/1511863801518227588/static", "1489398661619384321/1511863804592521317/static", "1489398661619384321/1511863813127929897/static"], { overflowTop: 271, overflowBottom: 182, order: "backTopFrontTopFrontBottom" }),
  frame("dark-roses-blue", "Rosas Sombrias (Azul)", ["1515124557290410204/1515124885113012234/static", "1515124557290410204/1515124888313266236/static"], { overflowTop: 211, overflowBottom: 186, order: "frontPair" }),
  frame("meow-kitty-gray", "Gatinho Miau Miau (Cinza)", ["1522381656684761098/1522381902995132536/static", "1522381656684761098/1522381906627268640/static", "1522381656684761098/1522381910544879691/static", "1522381656684761098/1522381916764897321/static"], { overflowHorizontal: 54, overflowTop: 301, overflowBottom: 147 }),
  frame("spider-man-web", "Teia do Homem-Aranha", ["1536492428268281996/1536492935170760895/static", "1536492428268281996/1536492940480872449/static", "1536492428268281996/1536492944750542958/static", "1536492428268281996/1536492948894515230/static"]),
  frame("moth-blue", "Mariposa (Azul)", ["1517301132211388507/1524824143315599390/static", "1517301132211388507/1524824154560397552/static", "1517301132211388507/1524824160310792243/static"], { overflowTop: 298, overflowBottom: 107, order: "frontTopBottomBackTop" }),
  frame("neon-chaos-green", "Caos Neon (Verde)", ["1491910929141727413/1514424115258200205/static", "1491910929141727413/1514424118911566014/static", "1491910929141727413/1514424121641930803/static"], { order: "frontTopBottomBackTop" }),
  frame("crystals-carnelian", "Cristais (Cornalina)", ["1509183145751220377/1514423553527779490/static", "1509183145751220377/1514423556451205140/static"], { overflowBottom: 0, order: "topPair" }),
  frame("starlight-realm", "Reino da Luz Estelar", ["1493974583311859733/1511864765062975640/static", "1493974583311859733/1511864769370394735/static"], { overflowTop: 156, overflowBottom: 63, order: "frontPair" }),
  frame("lake-friends", "Amigos do Lago", ["1491911825837785238/1514422210209644636/static", "1491911825837785238/1514422213829464105/static", "1491911825837785238/1514422217692283042/static", "1491911825837785238/1514422221584470208/static"]),
  frame("crystals-aquamarine", "Cristais (Água-marinha)", ["1509183143905857589/1514423210181918872/static", "1509183143905857589/1514423213403279380/static"], { overflowBottom: 0, order: "topPair" }),
  frame("neon-chaos-blue", "Caos Neon (Azul)", ["1511871218633146408/1514424379709198548/static", "1511871218633146408/1514424383790387230/static", "1511871218633146408/1514424387443359915/static"], { order: "frontTopBottomBackTop" }),
  frame("venom", "Venom", ["1536492991093678183/1536493305460686919/static", "1536492991093678183/1536493309436895253/static", "1536492991093678183/1536493313946026135/static"], { overflowTop: 295, overflowBottom: 161, order: "frontTopBackTopBackBottom" }),
  frame("vengeance-blue", "Vingança (Azul)", ["1507152062134358176/1514421634222526506/static", "1507152062134358176/1514421637540352071/static"], { overflowBottom: 0, order: "topPair" }),
  frame("tropical-symphony", "Sinfonia Tropical", ["1527812336750952489/1527812764574421124/static", "1527812336750952489/1527812769129304214/static", "1527812336750952489/1527812777664708718/static"], { order: "frontPairBackBottom" }),
  frame("crystals-peridot", "Cristais (Peridoto)", ["1509183144786657413/1514423455905349705/static", "1509183144786657413/1514423458833109165/static"], { overflowBottom: 0, order: "topPair" }),
  frame("dimensional-split", "Divisão Dimensional", ["1489399523238477855/1517237009217753168/static", "1489399523238477855/1517237013818900621/static"], { overflowTop: 288, overflowBottom: 145, order: "frontPair" }),
  frame("kawaii-cat", "Gato Kawaii", ["1489396533643448380/1511832453369827559/static", "1489396533643448380/1511832456381071471/static"], { overflowBottom: 135, order: "frontPair" }),
  frame("dragon-ruby", "Dragon (Rubi)", ["1519072056560455851/1519072278669692938/static", "1519072056560455851/1519072284084797571/static", "1519072056560455851/1519072295086330008/static", "1519072056560455851/1519072302766100520/static"]),
  frame("croak-croak", "Croac, croac", ["1526704581168468161/1526704820344455319/static", "1526704581168468161/1526704827751596202/static"], { overflowTop: 280, overflowBottom: 202, order: "frontPair" }),
  frame("dragon-sapphire", "Dragon (Safira)", ["1519072339185369239/1519072528654401563/static", "1519072339185369239/1519072534073708775/static", "1519072339185369239/1519072552004096192/static", "1519072339185369239/1519072557339246703/static"]),
  frame("precious-metal", "Metal Precioso", ["1524191448898080929/1526660580260188300/static", "1524191448898080929/1526660586237067364/static"], { overflowTop: 216, overflowBottom: 103, order: "frontPair" }),
  frame("dragon-pink", "Dragon (Rosa)", ["1519071720672329779/1519071938754904185/static", "1519071720672329779/1519071945079914577/static", "1519071720672329779/1519071954408046633/static", "1519071720672329779/1519071961353949394/static"], { overflowBottom: 178 }),
  frame("dragon-jade", "Dragon (Jade)", ["1506402031986802930/1519088935509295224/static", "1506402031986802930/1519088941628919828/static", "1506402031986802930/1519088951892250755/static", "1506402031986802930/1519088957789311066/static"], { overflowBottom: 178 }),
  frame("encore", "Bis", ["1527085511544410274/1527085678985220128/static", "1527085511544410274/1527085684559708260/static", "1527085511544410274/1527085689269911692/static", "1527085511544410274/1527085693535391774/static"]),
  frame("guardian-tiger", "Tigre Guardião", ["1484726324592640058/1514422015787012136/static", "1484726324592640058/1514422019163291710/static", "1484726324592640058/1514422022787043438/static", "1484726324592640058/1514422025803010048/static"], { overflowTop: 297 }),
];

export const PROFILE_FRAME_IDS = new Set(PROFILE_FRAMES.map(([id]) => id));

export function profileFrameLayers(id) {
  return PROFILE_FRAMES.find(([value]) => value === id)?.[2] || [];
}

export function profileFrameLayout(id) {
  return FRAME_LAYOUTS.get(id) || null;
}

export function profileFrameVariables(id) {
  const layout = profileFrameLayout(id);
  if (!layout) return {};
  const width = layout.containerWidth || 1200;
  return {
    "--profile-frame-render-width": `${((width + (layout.overflowHorizontal * 2)) / width) * 100}%`,
    "--profile-frame-top-offset": `${(-layout.overflowTop / width) * 100}cqi`,
    "--profile-frame-bottom-offset": `${(-layout.overflowBottom / width) * 100}cqi`,
    "--profile-frame-top-space": `calc(${(layout.overflowTop / width) * 100}% + 14px)`,
    "--profile-frame-bottom-space": `calc(${(layout.overflowBottom / width) * 100}% + 14px)`,
  };
}
