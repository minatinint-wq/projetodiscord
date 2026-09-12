import fs from "node:fs/promises";
import {GAME_CATALOG} from "../game-catalog.js";
import {GAME_ARTWORK} from "../game-artwork.js";
const output={...GAME_ARTWORK},games=GAME_CATALOG.filter(g=>!output[g.name]);
const aliases={"Lost Ark":"Lost Ark (video game)","Free Fire":"Free Fire (video game)","NieR Replicant":"Nier (video game)","Space Marine":"Warhammer 40,000: Space Marine","Madden NFL 25":"Madden NFL 25 (2024 video game)","The Witcher 3: Wild Hunt":"The Witcher 3: Wild Hunt","Pokemon Trading Card Game Pocket":"Pokémon Trading Card Game Pocket"};
async function query(q){const r=await fetch("https://en.wikipedia.org/w/api.php?"+new URLSearchParams({action:"query",format:"json",redirects:"1",...q}),{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error("Wikipedia "+r.status+"; tente mais tarde");return r.json();}
const names=games.map(g=>aliases[g.name]||g.name.replace(/^Pokemon/,"Pokémon"));
const data=await query({titles:names.join("|"),prop:"revisions",rvprop:"content",rvslots:"main"});
const mapping=new Map([...(data.query?.normalized||[]),...(data.query?.redirects||[])].map(r=>[r.from,r.to]));
const matches=[];
const knownFiles={"Demon Slayer: The Hinokami Chronicles":"File:Demon Slayer Kimetsu no Yaiba – The Hinokami Chronicles box art.jpg","Fire Emblem: Three Houses":"File:Fire Emblem Three Houses.jpg"};
for(let i=0;i<games.length;i++){
 if(knownFiles[games[i].name]){matches.push({game:games[i],file:knownFiles[games[i].name]});continue;}
 let title=names[i];for(let n=0;n<5&&mapping.has(title);n++)title=mapping.get(title);
 const page=Object.values(data.query?.pages||{}).find(p=>p.title===title);
 const source=page?.revisions?.[0]?.slots?.main?.["*"]||"";
 const match=source.match(/\|\s*(?:image|Image)\s*=\s*([^\n]+)/);
 const file=match?.[1]?.replace(/<!--.*?-->/g,"").trim().replace(/^\[\[(?:File|Image):/,"").split("|")[0].replace(/\]\]$/,"");
 if(file&&/\.(png|jpe?g|svg|webp)/i.test(file))matches.push({game:games[i],file:file.startsWith("File:")?file:"File:"+file});
}
await new Promise(resolve=>setTimeout(resolve,3500));
if(matches.length){
 const info=await query({titles:matches.map(m=>m.file).join("|"),prop:"imageinfo",iiprop:"url",iiurlwidth:"120"});
 for(const m of matches){const item=Object.values(info.query?.pages||{}).find(p=>p.title===m.file)?.imageinfo?.[0];if(item?.url)output[m.game.name]={url:item.thumburl||item.url,source:item.descriptionurl,name:m.game.name};}
}
await fs.writeFile(new URL("../game-artwork.js",import.meta.url),"// Game artwork metadata; original source retained per image.\nexport const GAME_ARTWORK = "+JSON.stringify(output,null,2)+";\n");
console.log("Artwork",Object.keys(output).length,"/400");
console.log("Missing:",GAME_CATALOG.filter(g=>!output[g.name]).map(g=>g.name).join(", "));
