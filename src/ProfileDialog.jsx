import React,{useEffect,useRef,useState} from "react";
import {X,Gamepad2,MessageSquare,UserPlus,Volume2,PenLine,Sparkles,Heart} from "lucide-react";
import ProfileCard from "./ProfileCard";
import {GameIcon,StyledName} from "./ProfileIdentity";
import {GAME_CATALOG} from "../game-catalog";
export default function ProfileDialog({data,currentUser,onClose,onRetry,onEdit,onMessage,onAddFriend,onVoice,Avatar,ProfileEffectLayer,renderBadges,presence,isFriend,serverRole}){
 const [tab,setTab]=useState("profile"),root=useRef(null);
 useEffect(()=>{const previous=document.activeElement;root.current?.querySelector("button")?.focus();return()=>previous?.isConnected&&previous.focus();},[]);
 const user=data?.user,own=user?.id===currentUser.id;
 const games=(user?.gameInterests||[]).map(id=>GAME_CATALOG.find(g=>g.id===id)).filter(Boolean);
 const common=games.filter(game=>currentUser.gameInterests?.includes(game.id));
 function keyDown(event){
  if(event.key==="Escape"){event.stopPropagation();onClose();}
  if(event.key!=="Tab")return;
  const buttons=[...root.current.querySelectorAll("button:not(:disabled),a[href],[tabindex='0']")];
  const first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
 return <div className="identity-backdrop" onClick={event=>event.target===event.currentTarget&&onClose()} onKeyDown={keyDown}>
 <section ref={root} className="identity-dialog" role="dialog" aria-modal="true" aria-label={user?"Perfil de "+user.displayName:"Perfil"}>
 <button className="identity-close" onClick={onClose} aria-label="Fechar perfil"><X size={20}/></button>
 {!user?<div className="identity-loading">{data?.error?<><h2>Não foi possível abrir o perfil</h2><p role="alert">{data.error}</p><button className="prompt-confirm" onClick={onRetry}>Tentar novamente</button></>:<p role="status">Carregando perfil…</p>}</div>:<>
 <aside className="identity-side"><ProfileCard {...{user,Avatar,ProfileEffectLayer,renderBadges,presence}}/>
 <div className="identity-actions">{own?<button onClick={onEdit}><PenLine size={16}/>Editar perfil</button>:isFriend?<button onClick={()=>onMessage(user)}><MessageSquare size={16}/>Mensagem</button>:<button onClick={()=>onAddFriend(user)}><UserPlus size={16}/>Adicionar amigo</button>}</div></aside>
 <main className="identity-main"><header><span className="eyebrow">CONHEÇA QUEM ESTÁ DO OUTRO LADO</span><h1><StyledName user={user}/></h1><p>Conexões começam com interesses em comum.</p></header>
 <nav className="identity-tabs" aria-label="Abas do perfil">{[["profile","Perfil"],["activity","Atividade"],["wishlist","Lista de desejos"]].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
 <div className="identity-tab-content">
 {tab==="profile"&&<><section className="identity-section"><h3>SOBRE MIM</h3><p className="identity-full-bio">{user.bio||"Este perfil ainda não tem uma biografia."}</p></section>
 {!!serverRole&&<section className="identity-section"><h3>CARGO NESTA COMUNIDADE</h3><span className="identity-role" style={{"--role-color":serverRole.color}}><i/>{serverRole.name}</span></section>}
 {!own&&!!common.length&&<section className="identity-section"><h3>VOCÊS TÊM {common.length} JOGO{common.length===1?"":"S"} EM COMUM</h3><div className="identity-games">{common.map(game=><article key={game.id}><GameIcon game={game}/><strong>{game.name}</strong><Heart size={14}/></article>)}</div></section>}
 <section className="identity-section"><h3><Gamepad2 size={15}/>JOGOS DE INTERESSE <span>{games.length}</span></h3>{games.length?<div className="identity-games">{games.map(game=><article key={game.id}><GameIcon game={game}/><strong>{game.name}</strong></article>)}</div>:<div className="identity-empty"><Gamepad2/><p>{own?"Adicione seus jogos no editor de perfil.":"Nenhum jogo escolhido por enquanto."}</p>{own&&<button onClick={onEdit}>Escolher jogos</button>}</div>}</section></>}
 {tab==="activity"&&<><section className="identity-section"><h3>STATUS PERSONALIZADO</h3>{user.activityText?<div className="identity-activity"><Sparkles/><p>{user.activityText}</p></div>:<div className="identity-empty"><Sparkles/><p>Nenhum status personalizado no momento.</p></div>}</section>
 <section className="identity-section"><h3>CHAMADA</h3>{data.voice?<div className="identity-activity"><Volume2/><div><strong>{data.voice.channelName}</strong><p>Em uma chamada que você pode acessar.</p><button onClick={()=>onVoice(data.voice)}>Abrir chamada</button></div></div>:<p>Não está em uma chamada visível para você.</p>}</section><p className="identity-hint">Jogos favoritos são interesses escolhidos pela pessoa, não detecção automática do jogo aberto.</p></>}
 {tab==="wishlist"&&<section className="identity-section"><h3>LISTA DE DESEJOS</h3>{user.wishlist?<div className="identity-wishes">{user.wishlist.split("\n").filter(line=>line.trim()).map((line,index)=><p key={index}><Heart size={17}/>{line}</p>)}</div>:<div className="identity-empty"><Heart/><p>{own?"O que você quer jogar depois? Conte na aba Jogos de interesse do editor.":"Esta pessoa ainda não compartilhou uma lista de desejos."}</p>{own&&<button onClick={onEdit}>Editar lista</button>}</div>}</section>}
 </div></main></>}
 </section></div>;
}
