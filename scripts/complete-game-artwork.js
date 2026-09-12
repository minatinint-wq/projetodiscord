import fs from "node:fs/promises";
import {GAME_CATALOG} from "../game-catalog.js";
import {GAME_ARTWORK} from "../game-artwork.js";
const output={...GAME_ARTWORK};
const clean=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
const aliases={"Skyrim":"The Elder Scrolls V: Skyrim","Civilization VI":"Sid Meier's Civilization VI","Civilization VII":"Sid Meier's Civilization VII","Vermintide 2":"Warhammer: Vermintide 2","Space Marine":"Warhammer 40,000: Space Marine","Final Fantasy X":"Final Fantasy X/X-2 HD Remaster","Kingdom Hearts II":"Kingdom Hearts HD 1.5 + 2.5 ReMIX","Uncharted 4":"Uncharted: Legacy of Thieves Collection","The Last of Us Part II":"The Last of Us Part II Remastered"};
async function json(url){const r=await fetch(url,{headers:{"User-Agent":"SeshGameCatalog/1.2"},signal:AbortSignal.timeout(20000)});if(r.status===429){const wait=Math.min(120,Math.max(30,Number(r.headers.get("retry-after"))||60));console.log("Fonte solicitou pausa:",wait,"s");await new Promise(resolve=>setTimeout(resolve,wait*1000));throw new Error("429; retomar em outra execução");}if(!r.ok)throw new Error(r.status);return r.json();}
const wiki=q=>json("https://en.wikipedia.org/w/api.php?"+new URLSearchParams({action:"query",format:"json",redirects:"1",...q}));
let games=GAME_CATALOG.filter(g=>!output[g.name]);
for(let start=0;start<games.length;start+=10){
 const batch=games.slice(start,start+10);
 try{
  const names=batch.map(g=>g.name.replace(/^Pokemon/,"Pokémon"));
  const data=await wiki({titles:names.join("|"),prop:"images",imlimit:"max"});
  const mapping=new Map([...(data.query?.normalized||[]),...(data.query?.redirects||[])].map(r=>[r.from,r.to]));
  const matches=[];
  for(let i=0;i<batch.length;i++){
   let title=names[i];for(let n=0;n<5&&mapping.has(title);n++)title=mapping.get(title);
   const page=Object.values(data.query?.pages||{}).find(p=>p.title===title);
   const prefix=clean(title).slice(0,10);
   const candidates=(page?.images||[]).filter(img=>clean(img.title).includes(prefix)&&!/(screenshot|gameplay|commons|wikiquote)/i.test(img.title));
   candidates.sort((a,b)=>Number(/(app.?icon|box.?art|cover|logo|vector)/i.test(b.title))-Number(/(app.?icon|box.?art|cover|logo|vector)/i.test(a.title)));
   if(candidates[0])matches.push({game:batch[i],file:candidates[0].title});
  }
  if(matches.length){
   const info=await wiki({titles:matches.map(m=>m.file).join("|"),prop:"imageinfo",iiprop:"url",iiurlwidth:"120"});
   for(const m of matches){const item=Object.values(info.query?.pages||{}).find(p=>p.title===m.file)?.imageinfo?.[0];if(item?.url)output[m.game.name]={url:item.thumburl||item.url,source:item.descriptionurl,name:m.game.name};}
  }
 }catch(e){console.log("Wikipedia batch",start,e.message);}
 await new Promise(r=>setTimeout(r,2500));
}
for(const game of GAME_CATALOG.filter(g=>!output[g.name])){
 try{
  const term=aliases[game.name]||game.name;
  const data=await json("https://store.steampowered.com/api/storesearch/?l=english&cc=us&term="+encodeURIComponent(term));
  const key=clean(term);
  const item=data.items?.find(i=>{const candidate=clean(i.name);return candidate===key||candidate.startsWith(key+"remastered")||candidate.startsWith(key+"definitive")||candidate.startsWith(key+"ultimate")||candidate.startsWith(key+"enhanced")||candidate.startsWith(key+"directorscut")||candidate.startsWith(key+"gameoftheyear");});
  if(item?.tiny_image)output[game.name]={url:item.tiny_image,source:"https://store.steampowered.com/app/"+item.id+"/",name:item.name};
 }catch{}
 await new Promise(r=>setTimeout(r,220));
}
await fs.writeFile(new URL("../game-artwork.js",import.meta.url),"// Game artwork metadata; original source retained per image.\nexport const GAME_ARTWORK = "+JSON.stringify(output,null,2)+";\n");
console.log("Artwork",Object.keys(output).length,"/400");
console.log("Missing:",GAME_CATALOG.filter(g=>!output[g.name]).map(g=>g.name).join(", "));
