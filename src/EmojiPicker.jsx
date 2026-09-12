import React,{useState,useEffect,useRef} from "react";
import {Smile,Search} from "lucide-react";
const groups=[
 ["Rostos","😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😋 😛 😜 🤪 🤨 🧐 🤓 😎 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 🥺 😭 😤 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠"],
 ["Gestos","👍 👎 👏 🙌 👐 🤲 🤝 🙏 ✌️ 🤞 🤟 🤘 👌 🤌 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤙 💪 🦾 🖕 ✍️"],
 ["Corações","❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 🔥 ✨ ⭐ 🌟 💫 ⚡ 💥 💯 ✅ ❌"],
 ["Jogos","🎮 🕹️ 👾 🎲 ♟️ 🏆 🥇 🥈 🥉 🎯 🎳 🎰 🧩 🎨 🎵 🎶 🎤 🎧 🎸 🎹 🥁 🎬 🎥 🖥️ 💻 📱 🚀 🛸"],
 ["Natureza","🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐸 🐵 🐔 🐧 🦉 🦋 🐝 🐢 🐙 🐬 🌸 🌺 🌻 🌹 🌷 🌼 🌿 🍀 🌵 🌴 🌲 🌈 ☀️ 🌙 ☁️ ❄️ 🌊"],
 ["Comida","🍕 🍔 🍟 🌭 🌮 🌯 🥙 🥪 🍣 🍜 🍝 🍙 🍿 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 🍎 🍓 🍒 🍉 🍌 🍋 🥑 ☕ 🍵 🧃 🥤 🧋 🍺 🥂"]
];
export default function EmojiPicker({onSelect}){
 const [open,setOpen]=useState(false),[group,setGroup]=useState("Rostos"),[query,setQuery]=useState("");
 const host=useRef(null);
 useEffect(()=>{if(!open)return;const outside=e=>{if(!host.current?.contains(e.target))setOpen(false);};const escape=e=>{if(e.key==="Escape")setOpen(false);};document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};},[open]);
 return <div className="emoji-picker" ref={host}><button type="button" aria-label="Escolher emoji" aria-expanded={open} onClick={()=>setOpen(!open)}><Smile size={20}/></button>{open&&<section className="emoji-popover" role="dialog" aria-label="Emojis"><label className="settings-search"><Search size={16}/><input autoFocus placeholder="Buscar categoria ou emoji" value={query} onChange={e=>setQuery(e.target.value)}/></label><nav>{groups.map(([name])=><button type="button" key={name} className={group===name?"active":""} onClick={()=>{setGroup(name);setQuery("");}}>{name}</button>)}</nav><div className="emoji-grid">{groups.filter(([name,list])=>query?name.toLowerCase().includes(query.toLowerCase())||list.includes(query):name===group).flatMap(([,list])=>list.split(" ")).map(emoji=><button type="button" key={emoji} title={emoji} onClick={()=>{onSelect(emoji);setOpen(false);}}>{emoji}</button>)}</div></section>}</div>;
}
