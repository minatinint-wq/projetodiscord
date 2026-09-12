import React,{useState,useRef} from "react";
import {X,Camera,ImagePlus,Search,Sparkles,Gamepad2,UserRound,ShieldCheck,Check} from "lucide-react";
import {PROFILE_EFFECTS,AVATAR_FRAMES,NAME_EFFECTS} from "../cosmetics";
import {GAME_CATALOG} from "../game-catalog";
export function GameIcon({game}) {
 const [failed,setFailed]=useState(false);
 return game.iconUrl&&!failed?<img className="game-icon" src={game.iconUrl} alt="" loading="lazy" onError={()=>setFailed(true)}/>:<span className="game-icon game-icon-fallback" style={{background:game.accent}} title={game.name}>{game.name.split(/\s+/).map(s=>s[0]).slice(0,2).join("")}</span>;
}
export function StyledName({user,children}) {
 return <span className={"styled-name name-effect-"+(user?.nameEffect||"solid")+" font-"+(user?.nameStyle||"default")} style={{"--name-color":user?.nameColor||"#f1f3f5"}}>{children||user?.displayName||user?.username}</span>;
}
export default function ProfileEditor({user,onClose,onSave,Avatar,ProfileEffectLayer}) {
 const [form,setForm]=useState(()=>({...user,bio:user.bio||"",banner:user.banner||null,avatar:user.avatar||null,
  gameInterests:user.gameInterests||[],password:""}));
 const initial=useRef(JSON.stringify(form));
 const [tab,setTab]=useState("profile"),[query,setQuery]=useState(""),[busy,setBusy]=useState(false),[reading,setReading]=useState(false),[error,setError]=useState("");
 const avatarInput=useRef(null),bannerInput=useRef(null);
 const changed=JSON.stringify(form)!==initial.current;
 const nitro=(user.badges||[]).includes("nitro_classic");
 const update=(key,value)=>setForm(current=>({...current,[key]:value}));
 async function save(){
  if(busy||reading)return;setBusy(true);setError("");
  try{await onSave(form);initial.current=JSON.stringify(form);}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function imageFile(key,event){
  const file=event.target.files?.[0];event.target.value="";if(!file)return;setError("");
  if(!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type))return setError("Use PNG, JPEG, WebP ou GIF.");
  if(file.type==="image/gif"&&!nitro)return setError("GIF é exclusivo de contas com a insígnia Nitro Classic. Escolha uma imagem estática.");
  if(file.size>20*1024*1024)return setError("Escolha uma imagem de até 20 MB.");
  setReading(true);
  try{
   let result=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Não foi possível ler a imagem."));reader.readAsDataURL(file);});
   if(result.length>4_000_000){
    if(file.type==="image/gif")throw new Error("Use um GIF de até 3 MB.");
    result=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const canvas=document.createElement("canvas");const scale=Math.min(1,(key==="avatar"?768:1600)/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL("image/webp",.85));};image.onerror=()=>reject(new Error("Imagem inválida."));image.src=result;});
   }
   if(result.length>4_250_000)throw new Error("A imagem ainda é grande demais. Escolha uma menor.");
   update(key,result);
  }catch(e){setError(e.message);}finally{setReading(false);}
 }
 const choices=(field,options)=><div className="studio-grid">{options.map(([value,label])=><button type="button" key={value} className={"studio-choice "+(form[field]===value?"selected":"")} aria-pressed={form[field]===value} onClick={()=>update(field,value)}>
  <span className="studio-choice-art">{field==="avatarFrame"?<Avatar user={{...form,avatarFrame:value}}/>:field==="nameEffect"?<StyledName user={{...form,nameEffect:value}}>Sesh</StyledName>:<><span className="studio-mini-orb"/><ProfileEffectLayer effect={value}/></>}</span><span>{label}</span>{form[field]===value&&<Check size={14}/>}</button>)}</div>;
 return <div className="profile-settings-backdrop"><section className="profile-editor" role="dialog" aria-modal="true" aria-label="Editar perfil">
  <aside className="profile-editor-nav"><div className="settings-person"><Avatar user={form}/><div><strong>{user.displayName}</strong><small>Seu espaço no Sesh</small></div></div><span className="eyebrow">PERFIL PRINCIPAL</span>
  {[["profile","Perfil",UserRound],["appearance","Efeitos e estilo",Sparkles],["games","Jogos de interesse",Gamepad2],["account","Conta",ShieldCheck]].map(([id,label,Icon])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><Icon size={18}/>{label}</button>)}
  <p>Suas alterações aparecem na prévia. Salve quando estiver tudo pronto.</p></aside>
  <main className="profile-editor-main"><header><div><span className="eyebrow">FAÇA DO SEU JEITO</span><h1>{tab==="profile"?"Um perfil com a sua cara":tab==="appearance"?"Seu estilo, em movimento":tab==="games"?"O que você joga?":"Informações da conta"}</h1></div><button className="settings-close" aria-label="Fechar perfil" onClick={onClose}><X/></button></header>
  <div className="profile-editor-columns"><div className="profile-editor-fields">
  {tab==="profile"&&<><section className="settings-card"><h2>Foto e banner</h2><p>Imagens estáticas para todos. GIF animado para contas com a insígnia Nitro Classic.</p><div className="profile-upload-actions"><button className="secondary-setting" onClick={()=>avatarInput.current.click()}><Camera size={18}/>Alterar foto</button><button className="secondary-setting" onClick={()=>bannerInput.current.click()}><ImagePlus size={18}/>Alterar banner</button></div>
  <input ref={avatarInput} type="file" accept={nitro?"image/png,image/jpeg,image/webp,image/gif":"image/png,image/jpeg,image/webp"} hidden onChange={e=>imageFile("avatar",e)}/><input ref={bannerInput} type="file" accept={nitro?"image/png,image/jpeg,image/webp,image/gif":"image/png,image/jpeg,image/webp"} hidden onChange={e=>imageFile("banner",e)}/>
  <div className="profile-upload-actions">{form.avatar&&<button className="text-button" onClick={()=>update("avatar",null)}>Remover foto</button>}{form.banner&&<button className="text-button" onClick={()=>update("banner",null)}>Remover banner</button>}</div></section>
  <section className="settings-card"><label className="setting-field">Nome de exibição<input maxLength={80} value={form.displayName||""} onChange={e=>update("displayName",e.target.value)}/></label><label className="setting-field">Sobre você<textarea maxLength={300} rows={4} placeholder="Conte um pouco sobre você…" value={form.bio} onChange={e=>update("bio",e.target.value)}/><small>{form.bio.length}/300</small></label><label className="setting-field">Atividade<input maxLength={120} placeholder="Preparando a próxima partida" value={form.activityText||""} onChange={e=>update("activityText",e.target.value)}/></label></section></>}
  {tab==="appearance"&&<><section className="settings-card"><h2>Molduras de avatar</h2><p>Detalhes que acompanham você no chat e nas chamadas.</p>{choices("avatarFrame",AVATAR_FRAMES)}</section><section className="settings-card"><h2>Efeitos de perfil</h2>{choices("profileEffect",PROFILE_EFFECTS)}</section><section className="settings-card"><h2>Estilo do nome</h2>{choices("nameEffect",NAME_EFFECTS)}<label className="setting-field">Cor principal<input type="color" value={form.nameColor||"#f1f3f5"} onChange={e=>update("nameColor",e.target.value)}/></label><label className="setting-field">Fonte<select value={form.nameStyle||"default"} onChange={e=>update("nameStyle",e.target.value)}>{["default","serif","rounded","mono","pixel","script","gothic"].map(font=><option key={font} value={font}>{font==="default"?"Padrão":font}</option>)}</select></label></section></>}
  {tab==="games"&&<section className="settings-card"><h2>Seus jogos favoritos <small>{form.gameInterests.length}/12</small></h2><label className="settings-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar entre 400 jogos"/></label><div className="games-gallery">{GAME_CATALOG.filter(game=>game.name.toLowerCase().includes(query.toLowerCase())).map(game=><button className={form.gameInterests.includes(game.id)?"selected":""} key={game.id} disabled={!form.gameInterests.includes(game.id)&&form.gameInterests.length>=12} onClick={()=>update("gameInterests",form.gameInterests.includes(game.id)?form.gameInterests.filter(id=>id!==game.id):[...form.gameInterests,game.id])}><GameIcon game={game}/><span>{game.name}</span>{form.gameInterests.includes(game.id)&&<Check size={14}/>}</button>)}</div><label className="setting-field">Lista de desejos<textarea maxLength={300} value={form.wishlist||""} onChange={e=>update("wishlist",e.target.value)}/></label></section>}
  {tab==="account"&&<section className="settings-card"><h2>Dados da conta</h2><label className="setting-field">Nome de usuário<input maxLength={20} value={form.username||""} onChange={e=>update("username",e.target.value)}/></label><label className="setting-field">E-mail<input type="email" value={form.email||""} onChange={e=>update("email",e.target.value)} disabled={user.isMasterAdmin||user.isCreator}/></label><label className="setting-field">Nova senha<input type="password" autoComplete="new-password" value={form.password} onChange={e=>update("password",e.target.value)}/><small>Deixe vazio para manter sua senha atual.</small></label></section>}
  </div><aside className="profile-editor-preview"><span className="eyebrow">PRÉVIA AO VIVO</span><section className="studio-profile-card">
  <div className="studio-banner" style={form.banner?.startsWith("data:image/")?{backgroundImage:"url("+form.banner+")"}:{background:form.banner||"linear-gradient(125deg,#4040a0,#9864be,#e4a8b1)"}}/>
  <ProfileEffectLayer effect={form.profileEffect}/><div className="studio-profile-body"><Avatar user={form}/><h2><StyledName user={form}/></h2><small>@{form.username}#{user.tag}</small><p>{form.bio||"Sua próxima conversa começa aqui."}</p>{form.activityText&&<div className="activity-pill"><span/> {form.activityText}</div>}
  {!!form.gameInterests.length&&<><h3>JOGOS FAVORITOS</h3><div className="profile-game-chips">{form.gameInterests.map(id=>GAME_CATALOG.find(g=>g.id===id)).filter(Boolean).map(game=><span key={game.id}><GameIcon game={game}/>{game.name}</span>)}</div></>}
  </div></section><p>A prévia usa os mesmos efeitos do seu perfil público.</p></aside></div>
  </main><footer className="profile-save-bar"><div role="status">{error?<span className="save-error">{error}</span>:reading?"Preparando imagem…":changed?"Você tem alterações não salvas.":"Tudo salvo. Pronto para conversar."}</div><button className="prompt-confirm" disabled={busy||reading} onClick={save}>{busy?"Salvando…":"Salvar alterações"}</button></footer>
 </section></div>;
}
