import fs from "node:fs/promises";
import { GAME_CATALOG } from "../game-catalog.js";
import { GAME_ARTWORK } from "../game-artwork.js";
const output={...GAME_ARTWORK};
const normalize=value=>value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
let next=0, found=0;
async function worker(){
 while(next<GAME_CATALOG.length){
  const game=GAME_CATALOG[next++];
  if(output[game.name])continue;
  try{
   const url="https://store.steampowered.com/api/storesearch/?l=english&cc=us&term="+encodeURIComponent(game.name);
   const response=await fetch(url,{signal:AbortSignal.timeout(10000)});
   if(!response.ok)continue;
   const data=await response.json();
   const item=data.items?.find(item=>normalize(item.name)===normalize(game.name));
   if(item?.tiny_image&&/^https:\/\//.test(item.tiny_image))output[game.name]={url:item.tiny_image,source:"https://store.steampowered.com/app/"+item.id+"/",name:item.name};
  }catch{}
  if(++found%40===0)console.log("Consultados:",found,"Capas encontradas:",Object.keys(output).length);
  await new Promise(resolve=>setTimeout(resolve,160));
 }
}
await Promise.all([worker(),worker(),worker()]);
await fs.writeFile(new URL("../game-artwork.js",import.meta.url),"// Artwork metadata from Steam Store. Regenerate with scripts/sync-game-artwork.js.\nexport const GAME_ARTWORK = "+JSON.stringify(output,null,2)+";\n");
console.log("Total de capas verificadas:",Object.keys(output).length,"/",GAME_CATALOG.length);
