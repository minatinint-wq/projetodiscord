export const BANNER_PRESETS = [
 ["aurora","Aurora","linear-gradient(120deg,#4855b8,#8756b1,#ce94be)"],
 ["midnight","Meia-noite","radial-gradient(ellipse at 70% 0,#4a4581,transparent 70%),linear-gradient(120deg,#111626,#26314a)"],
 ["sunset","Pôr do sol","linear-gradient(125deg,#6c39a7,#da677f,#f5b570)"],
 ["ocean","Oceano","linear-gradient(120deg,#183d6b,#297892,#69c7c4)"],
 ["forest","Floresta","linear-gradient(120deg,#173d3c,#397966,#acc997)"],
 ["candy","Algodão-doce","linear-gradient(120deg,#aa84d7,#eaa9c6,#a8cfe8)"],
 ["ember","Brasas","radial-gradient(ellipse at 75% 20%,#e4854d,transparent 65%),linear-gradient(120deg,#341a2d,#b84951)"],
 ["silver","Prata","linear-gradient(120deg,#424657,#a3a8c0,#575e76)"],
 ["celestial-tide","Maré celestial","url(/cosmetics-optimized/banners/celestial-tide.png)"],
 ["crimson-eclipse","Eclipse carmesim","url(/cosmetics-optimized/banners/crimson-eclipse.png)"],
 ["sakura-dawn","Amanhecer sakura","url(/cosmetics-optimized/banners/sakura-dawn.png)"],
 ["neon-pulse","Pulso neon","url(/cosmetics-optimized/banners/neon-pulse.png)"],
 ["steel-wolf","Lobo de aço","url(/cosmetics-optimized/banners/steel-wolf.png)"],
 ["infernal-dragon","Dragão infernal","url(/cosmetics-optimized/banners/infernal-dragon.png)"],
];
export const PROFILE_THEMES=[["default","Original","#9485fa"],["purple","Violeta","#b097ff"],["pink","Rosa","#f5a5ce"],["blue","Azul","#88b6fa"],["green","Jade","#80d1b0"],["red","Rubi","#eb8c9b"],["midnight","Noturno","#9baac9"],["sunset","Solar","#eeb681"],["ocean","Marinho","#81d9dc"],["aurora","Aurora","#b7b1f5"]];
export function bannerPresentation(user){
 const customBanner=typeof user.banner==="string"?user.banner:"";
 if(!customBanner&&user.bannerPreset==="none")return {backgroundImage:"none",backgroundColor:"transparent"};
 const background=customBanner
  ? (customBanner.startsWith("data:image/")||customBanner.startsWith("/api/users/") ? `url(${JSON.stringify(customBanner)})` : customBanner)
  : BANNER_PRESETS.find(([id])=>id===(user.bannerPreset||"aurora"))?.[2]||BANNER_PRESETS[0][2];
 return {backgroundImage:background.startsWith("#")?"none":background,backgroundColor:background.startsWith("#")?background:undefined,backgroundSize:"cover",backgroundPosition:(user.bannerPositionX??50)+"% "+(user.bannerPositionY??50)+"%"};
}
export function profilePresentation(user){
 const surface=user.profilePrimaryColor||({purple:"#241b35",pink:"#321d30",blue:"#17283d",green:"#182d26",red:"#321e26",midnight:"#111323",sunset:"#322224",ocean:"#132a30",aurora:"#202033"})[user.profileTheme]||"#191923";
 const rgb=surface.slice(1).match(/../g).map(c=>parseInt(c,16)),light=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>150;
 const end="#"+rgb.map(c=>Math.round(c*.62).toString(16).padStart(2,"0")).join("");

 return {"--profile-surface":surface,"--profile-surface-end":end,"--profile-ink":light?"#20202a":"#edeef4","--profile-muted":light?"#41414e":"#b5b6c9","--profile-accent":user.profileAccentColor||PROFILE_THEMES.find(([id])=>id===user.profileTheme)?.[2]||"#9485fa","--profile-effect-opacity":{subtle:.4,balanced:.7,vivid:1}[user.effectIntensity]??.7,"--profile-effect-speed":{slow:1.7,normal:1,fast:.65}[user.effectSpeed]??1};
}
