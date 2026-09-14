import React,{useState,useEffect,useRef} from "react";
import {X,Send,Plus,Users,Phone} from "lucide-react";
import {api} from "./api";
import EmojiPicker from "./EmojiPicker";
import EmojiText from "./EmojiText";
import {StyledName,GameIcon} from "./ProfileEditor";
import {GAME_CATALOG} from "../game-catalog";
import {readAttachment} from "./files";
import useFileDrop from "./useFileDrop";
import AttachmentView from "./AttachmentView";
import {bannerPresentation} from "./profilePresentation";
const messageTime=value=>new Date(value).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
function isCompactMessage(message,previous){
 if(!previous||previous.authorId!==message.authorId)return false;
 const gap=new Date(message.createdAt).getTime()-new Date(previous.createdAt).getTime();
 return gap>=0&&gap<7*60*1000&&new Date(message.createdAt).toDateString()===new Date(previous.createdAt).toDateString();
}
export default function DirectMessages({user,currentUser,onClose,onOpenProfile,onOpenFullProfile,onJoinVoice,Avatar}){
 const [messages,setMessages]=useState([]),[draft,setDraft]=useState(""),[attachment,setAttachment]=useState(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const input=useRef(null),bottom=useRef(null),readId=useRef(0);
 const [reading,setReading]=useState(false);
 const drop=useFileDrop(files=>attachFiles(files));
  const merge=message=>setMessages(current=>{
   const pending=message.clientMessageId&&current.find(item=>item.sendState&&item.clientMessageId===message.clientMessageId);
   if(pending)return current.map(item=>item.id===pending.id?message:item);
   return current.some(item=>item.id===message.id)?current:[...current,message];
  });
  function fillAttachments(list){
   const pending=(list||[]).filter(m=>m?.attachment?.ref);
   if(!pending.length)return;
   (async()=>{
    for(let i=0;i<pending.length;i+=6){
     const batch=pending.slice(i,i+6);
     const settled=await Promise.allSettled(batch.map(m=>api.directMessage(user.id,m.id)));
     const full={};
     settled.forEach(r=>{if(r.status==="fulfilled"&&r.value?.message?.id)full[r.value.message.id]=r.value.message;});
     if(Object.keys(full).length)setMessages(current=>current.map(m=>m.attachment?.ref&&full[m.id]?full[m.id]:m));
    }
   })().catch(()=>{});
  }
 useEffect(()=>{
  let active=true;readId.current++;setReading(false);setLoading(true);setMessages([]);setDraft("");setAttachment(null);setError("");
  const receive=({detail})=>{if([detail.authorId,detail.recipientId].includes(user.id)&&[detail.authorId,detail.recipientId].includes(currentUser.id))merge(detail);};
  window.addEventListener("sesh:direct-message",receive);
   api.directMessages(user.id).then(result=>{if(active){setMessages(current=>[...new Map([...result.messages,...current].map(m=>[m.id,m])).values()].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)));fillAttachments(result.messages);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;readId.current++;window.removeEventListener("sesh:direct-message",receive);};
 },[user.id,currentUser.id]);
 useEffect(()=>{bottom.current?.scrollIntoView({block:"end"});},[messages.length]);
 useEffect(()=>{const close=event=>{if(event.key==="Escape")onClose();};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[onClose]);
 async function send(event){
  event.preventDefault();if(reading||(!draft.trim()&&!attachment))return;
  const clientMessageId=crypto.randomUUID(),optimisticId=`pending:${clientMessageId}`;
  const payload={content:draft.trim(),attachment,clientMessageId};
  setError("");setDraft("");setAttachment(null);
  setMessages(current=>[...current,{id:optimisticId,clientMessageId,authorId:currentUser.id,recipientId:user.id,author:currentUser,content:payload.content,attachment:payload.attachment,createdAt:new Date().toISOString(),editedAt:null,sendState:"sending",pendingPayload:payload}]);
  try{const result=await api.sendDirectMessage(user.id,payload);setMessages(current=>[...current.filter(item=>item.id!==optimisticId&&item.id!==result.message.id),result.message].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)));}
  catch(e){setError(e.message);setMessages(current=>current.map(item=>item.id===optimisticId?{...item,sendState:"failed",sendError:e.message}:item));}
 }
 async function retry(message){
  if(!message.pendingPayload||message.sendState!=="failed")return;
  setMessages(current=>current.map(item=>item.id===message.id?{...item,sendState:"sending",sendError:null}:item));
  try{const result=await api.sendDirectMessage(user.id,message.pendingPayload);setMessages(current=>[...current.filter(item=>item.id!==message.id&&item.id!==result.message.id),result.message].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)));}
  catch(e){setError(e.message);setMessages(current=>current.map(item=>item.id===message.id?{...item,sendState:"failed",sendError:e.message}:item));}
 }
 async function attachFiles(files){if(!files.length)return;if(files.length>1)return setError("Envie um arquivo por mensagem.");
  const attempt=++readId.current;setReading(true);setError("");
  try{const result=await readAttachment(files[0]);if(attempt===readId.current)setAttachment(result);}
  catch(error){if(attempt===readId.current)setError(error.message);}finally{if(attempt===readId.current)setReading(false);}
 }
 function attach(event){const files=Array.from(event.target.files||[]);event.target.value="";attachFiles(files);}

 const activeGame=(user.gameInterests||[]).map(id=>GAME_CATALOG.find(game=>game.id===id)).find(Boolean);
 return <section className="direct-conversation"><header className="direct-header"><button className="icon-button" aria-label="Voltar para amigos" onClick={onClose}><X size={20}/></button><Avatar user={user} small/><div className="direct-header-person"><strong><StyledName user={user}/></strong><span>@{user.username}</span></div><div className="direct-header-actions">{user.voice&&<button onClick={()=>onJoinVoice(user.voice)} title="Entrar na chamada do amigo"><Phone size={18}/></button>}<button title="Ver resumo do perfil" onClick={onOpenProfile}><Users size={18}/></button></div></header>
 <div className={"direct-main file-drop-zone"+(drop.dragging?" dragging":"")} {...drop.bind}>{drop.dragging&&<div className="file-drop-overlay"><strong>Solte o arquivo aqui</strong><span>Até 3 MB · você confirma antes de enviar</span></div>}<div className="direct-messages" aria-live="polite"><div className="direct-welcome"><Avatar user={user}/><h2><StyledName user={user}/></h2><p>Esta é uma conversa só entre vocês.</p></div>{loading&&<p className="direct-loading">Carregando conversa…</p>}{messages.map((message,index)=>{const compact=isCompactMessage(message,messages[index-1]);return <article className={"dm-message"+(compact?" dm-message-compact":"")+(message.sendState?` message-${message.sendState}`:"")} key={message.id}>{compact?<time className="dm-hover-time" dateTime={message.createdAt}>{messageTime(message.createdAt)}</time>:<Avatar user={message.author} small/>}<div>{!compact&&<header><StyledName user={message.author}/><time dateTime={message.createdAt}>{messageTime(message.createdAt)}</time></header>}<p><EmojiText text={message.content}/></p>{message.attachment&&<AttachmentView attachment={message.attachment} alt="Imagem enviada na conversa"/>}{message.sendState==="sending"&&<span className="message-delivery-state">Enviando…</span>}{message.sendState==="failed"&&<button type="button" className="message-retry" title={message.sendError||"Falha no envio"} onClick={()=>retry(message)}>Falhou · tentar novamente</button>}</div></article>})}<div ref={bottom}/></div>
 {error&&<p className="form-error" role="alert">{error}</p>}{reading&&<p role="status">Preparando arquivo…</p>}{attachment&&<div className="dm-attachment"><AttachmentView attachment={attachment} preview/><button onClick={()=>setAttachment(null)}>Remover</button></div>}
 <form className="direct-composer" onSubmit={send}><input ref={input} type="file" hidden onChange={attach}/><button type="button" aria-label="Anexar arquivo" onClick={()=>input.current.click()}><Plus size={20}/></button><input maxLength={4000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={"Conversar com @"+user.username}/><EmojiPicker onSelect={emoji=>setDraft(current=>current+emoji)}/><button disabled={reading||(!draft.trim()&&!attachment)} aria-label="Enviar mensagem"><Send size={20}/></button></form></div>
 <aside className="direct-profile"><div className="direct-profile-banner" style={bannerPresentation(user)}/><Avatar user={user}/><h2><StyledName user={user}/></h2><p>{user.bio||"Diga oi e comece a conversa."}</p><h3>Jogos em destaque</h3><div className="profile-game-chips">{(user.gameInterests||[]).map(id=>GAME_CATALOG.find(game=>game.id===id)).filter(Boolean).map(game=><span key={game.id}><GameIcon game={game}/>{game.name}</span>)}</div><button className="direct-profile-link" onClick={onOpenFullProfile||onOpenProfile}>Ver perfil completo</button>{activeGame&&<div className="direct-activity-card"><small>JOGO DE INTERESSE</small><span><GameIcon game={activeGame}/><strong>{activeGame.name}</strong></span></div>}</aside>
 </section>;
}
