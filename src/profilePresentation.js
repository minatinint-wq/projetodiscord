export const BANNER_PRESETS = [
 ["aurora","Aurora","linear-gradient(120deg,#4855b8,#8756b1,#ce94be)"],
 ["midnight","Meia-noite","radial-gradient(ellipse at 70% 0,#4a4581,transparent 70%),linear-gradient(120deg,#111626,#26314a)"],
 ["sunset","Pôr do sol","linear-gradient(125deg,#6c39a7,#da677f,#f5b570)"],
 ["ocean","Oceano","linear-gradient(120deg,#183d6b,#297892,#69c7c4)"],
 ["forest","Floresta","linear-gradient(120deg,#173d3c,#397966,#acc997)"],
 ["candy","Algodão-doce","linear-gradient(120deg,#aa84d7,#eaa9c6,#a8cfe8)"],
 ["ember","Brasas","radial-gradient(ellipse at 75% 20%,#e4854d,transparent 65%),linear-gradient(120deg,#341a2d,#b84951)"],
 ["silver","Prata","linear-gradient(120deg,#424657,#a3a8c0,#575e76)"],
];
export const PROFILE_THEMES=[["default","Original","#9485fa"],["purple","Violeta","#b097ff"],["pink","Rosa","#f5a5ce"],["blue","Azul","#88b6fa"],["green","Jade","#80d1b0"],["red","Rubi","#eb8c9b"],["midnight","Noturno","#9baac9"],["sunset","Solar","#eeb681"],["ocean","Marinho","#81d9dc"],["aurora","Aurora","#b7b1f5"]];
export function bannerPresentation(user){
 const background=user.banner?.startsWith("data:image/") ? "url("+user.banner+")" : user.banner||BANNER_PRESETS.find(([id])=>id===(user.bannerPreset||"aurora"))?.[2]||BANNER_PRESETS[0][2];
 return {backgroundImage:background.startsWith("#")?"none":background,backgroundColor:background.startsWith("#")?background:undefined,backgroundSize:"cover",backgroundPosition:(user.bannerPositionX??50)+"% "+(user.bannerPositionY??50)+"%"};
}
export function profilePresentation(user){
 return {"--profile-accent":PROFILE_THEMES.find(([id])=>id===user.profileTheme)?.[2]||"#9485fa","--profile-effect-opacity":{subtle:.4,balanced:.7,vivid:1}[user.effectIntensity]??.7,"--profile-effect-speed":{slow:1.7,normal:1,fast:.65}[user.effectSpeed]??1};
}
