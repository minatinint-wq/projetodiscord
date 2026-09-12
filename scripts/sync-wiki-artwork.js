import fs from "node:fs/promises";
import {GAME_CATALOG} from "../game-catalog.js";
import {GAME_ARTWORK} from "../game-artwork.js";
const output={...GAME_ARTWORK};
const clean=value=>value.toLowerCase().replace(/[^a-z0-9]/g,"");
const headers={"User-Agent":"Sesh/1.2 (game artwork catalog)"};
let index=0;const missing=GAME_CATALOG.filter(game=>!output[game.name]);
async function api(query){const r=await fetch("https://en.wikipedia.org/w/api.php?"+new URLSearchParams({format:"json",...query}),{headers,signal:AbortSignal.timeout(12000)});return r.json();}
async function worker(){while(index<missing.length){const game=missing[index++];try{
 const data=await api({action:"query",titles:game.name.replace(/^Pokemon/,"Pokémon"),prop:"images",imlimit:"100",redirects:"1"});
 const page=Object.values(data.query?.pages||{}).find(page=>page.images);
 const candidates=(page?.images||[]).filter(image=>/logo|cover|box.?art|app.?icon/i.test(image.title)&&clean(image.title).includes(clean(game.name).slice(0,10)));
 candidates.sort((a,b)=>Number(/app.?icon/i.test(b.title))-Number(/app.?icon/i.test(a.title)));
 const image=candidates[0];if(!image)continue;
 const info=await api({action:"query",titles:image.title,prop:"imageinfo",iiprop:"url",iiurlwidth:"120"});
 const item=Object.values(info.query?.pages||{})[0]?.imageinfo?.[0];
 if(item?.thumburl||item?.url)output[game.name]={url:item.thumburl||item.url,source:item.descriptionurl,name:game.name};
 }catch{} }}
await Promise.all([worker(),worker(),worker()]);
await fs.writeFile(new URL("../game-artwork.js",import.meta.url),"// Game artwork from Steam Store and Wikimedia; source links retained per image.\nexport const GAME_ARTWORK = "+JSON.stringify(output,null,2)+";\n");
console.log("Jogos com imagem verificada:",Object.keys(output).length,"/ 400");
