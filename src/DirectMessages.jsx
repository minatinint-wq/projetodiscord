import React,{useState,useEffect,useRef} from "react";
import {X,Send,Plus,Users,Phone} from "lucide-react";
import {api} from "./api";
import EmojiPicker from "./EmojiPicker";
import {StyledName,GameIcon} from "./ProfileEditor";
import {GAME_CATALOG} from "../game-catalog";
export default function DirectMessages({user,currentUser,onClose,onOpenProfile,onJoinVoice,Avatar}){
 const [messages,setMessages]=useState([]),[draft,setDraft]=useState(""),[attachment,setAttachment]=useState(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const input=useRef(null),bottom=useRef(null),busyRef=useRef(false);
 const merge=message=>setMessages(current=>current.some(m=>m.id===message.id)?current:[...current,message]);
 useEffect(()=>{
  let active=true;setLoading(true);setMessages([]);setDraft("");setAttachment(null);setError("");
  const receive=({detail})=>{if([detail.authorId,detail.recipientId].includes(user.id)&&[detail.authorId,detail.recipientId].includes(currentUser.id))merge(detail);};
  window.addEventListener("sesh:direct-message",receive);
  api.directMessages(user.id).then(result=>{if(active)setMessages(current=>[...new Map([...result.messages,...current].map(m=>[m.id,m])).values()].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)));}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;window.removeEventListener("sesh:direct-message",receive);};
 },[user.id,currentUser.id]);
 useEffect(()=>{bottom.current?.scrollIntoView({block:"end"});},[messages.length]);
 async function send(event){
  event.preventDefault();if(busyRef.current||(!draft.trim()&&!attachment))return;
  busyRef.current=true;setBusy(true);setError("");
  try{const result=await api.sendDirectMessage(user.id,{content:draft.trim(),attachment});merge(result.message);setDraft("");setAttachment(null);}
  catch(e){setError(e.message);}finally{busyRef.current=false;setBusy(false);}
 }
 function attach(event){const file=event.target.files?.[0];event.target.value="";if(!file)return;
  if(!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type)||file.size>3*1024*1024)return setError("Use PNG, JPG, GIF ou WebP de até 3 MB.");
  const reader=new FileReader();reader.onload=()=>setAttachment(String(reader.result));reader.onerror=()=>setError("Falha ao ler a imagem.");reader.readAsDataURL(file);
 }
 return <section className="direct-conversation"><header className="direct-header"><button className="icon-button" aria-label="Voltar para amigos" onClick={onClose}><X size={20}/></button><Avatar user={user} small/><div className="direct-header-person"><strong><StyledName user={user}/></strong><span>@{user.username}</span></div><div className="direct-header-actions">{user.voice&&<button onClick={()=>onJoinVoice(user.voice)} title="Entrar na chamada do amigo"><Phone size={18}/></button>}<button title="Ver perfil" onClick={onOpenProfile}><Users size={18}/></button></div></header>
 <div className="direct-main"><div className="direct-messages" aria-live="polite"><div className="direct-welcome"><Avatar user={user}/><h2><StyledName user={user}/></h2><p>Uma conversa só entre vocês.</p></div>{loading&&<p>Carregando conversa…</p>}{messages.map(message=><article className="dm-message" key={message.id}><Avatar user={message.author} small/><div><header><StyledName user={message.author}/><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</time></header><p>{message.content}</p>{message.attachment&&<a href={message.attachment} target="_blank" rel="noreferrer"><img className="message-attachment" src={message.attachment} alt="Imagem enviada na conversa"/></a>}</div></article>)}<div ref={bottom}/></div>
 {error&&<p className="form-error" role="alert">{error}</p>}{attachment&&<div className="dm-attachment"><img src={attachment} alt="Anexo pronto"/><button onClick={()=>setAttachment(null)}>Remover</button></div>}
 <form className="direct-composer" onSubmit={send}><input ref={input} type="file" hidden accept="image/png,image/jpeg,image/gif,image/webp" onChange={attach}/><button type="button" aria-label="Anexar imagem" onClick={()=>input.current.click()}><Plus size={20}/></button><input disabled={busy} maxLength={4000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={"Conversar com @"+user.username}/><EmojiPicker onSelect={emoji=>setDraft(current=>current+emoji)}/><button disabled={busy||(!draft.trim()&&!attachment)} aria-label="Enviar mensagem"><Send size={20}/></button></form></div>
 <aside className="direct-profile"><div className="direct-profile-banner" style={user.banner?.startsWith("data:image/")?{backgroundImage:"url("+user.banner+")"}:{}}/><Avatar user={user}/><h2><StyledName user={user}/></h2><p>{user.bio||"Diga oi e comece a conversa."}</p><h3>Jogos em destaque</h3><div className="profile-game-chips">{(user.gameInterests||[]).map(id=>GAME_CATALOG.find(game=>game.id===id)).filter(Boolean).map(game=><span key={game.id}><GameIcon game={game}/>{game.name}</span>)}</div><button className="direct-profile-link" onClick={onOpenProfile}>Ver perfil completo</button></aside>
 </section>;
}
