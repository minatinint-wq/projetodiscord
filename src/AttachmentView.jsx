import React,{useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {Eye,EyeOff,FileDown,X} from "lucide-react";

export default function AttachmentView({attachment,preview=false,alt="Imagem enviada",nsfw=false}){
 const [url,setUrl]=useState("");
 const [revealed,setRevealed]=useState(false);
 const [expanded,setExpanded]=useState(false);
 useEffect(()=>{
  if(!attachment||typeof attachment==="string"){setUrl("");return;}
  const bytes=Uint8Array.from(atob(attachment.data.split(",")[1]),c=>c.charCodeAt(0));
  const link=URL.createObjectURL(new Blob([bytes],{type:"application/octet-stream"}));
  setUrl(link);return()=>URL.revokeObjectURL(link);
 },[attachment]);
 useEffect(()=>{setExpanded(false);},[attachment]);
 useEffect(()=>{
  if(!expanded)return undefined;
  const close=event=>{if(event.key==="Escape")setExpanded(false);};
  window.addEventListener("keydown",close);
  return()=>window.removeEventListener("keydown",close);
 },[expanded]);
 if(!attachment)return null;
 if(typeof attachment==="string"){
  const openImage=()=>{if(!preview&&(!nsfw||revealed))setExpanded(true);};
  const onImageKeyDown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openImage();}};
  const lightbox=expanded?createPortal(<div className="attachment-lightbox" role="dialog" aria-modal="true" aria-label="Visualização da imagem" onMouseDown={()=>setExpanded(false)}><button className="attachment-lightbox-close" type="button" aria-label="Fechar imagem" onClick={()=>setExpanded(false)}><X size={22}/></button><img className="attachment-lightbox-image" src={attachment} alt={alt} draggable="false" onMouseDown={event=>event.stopPropagation()}/><span>Clique com o botão direito para salvar</span></div>,document.body):null;
  if(nsfw&&!preview)return <><div className={`nsfw-attachment${revealed?" is-revealed":""}`}><img className={`message-attachment nsfw-image${revealed?" revealed can-open":""}`} src={attachment} alt={alt} loading="lazy" role={revealed?"button":undefined} tabIndex={revealed?0:undefined} onClick={openImage} onKeyDown={onImageKeyDown}/><span className="nsfw-label">Conteúdo NSFW</span><button className="nsfw-toggle" type="button" aria-label={revealed?"Ocultar imagem NSFW":"Revelar imagem NSFW"} aria-pressed={revealed} onClick={()=>setRevealed(current=>!current)}>{revealed?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{lightbox}</>;
  if(preview)return <img className="composer-attachment-preview" src={attachment} alt={alt} loading="eager"/>;
  return <><img className="message-attachment can-open" src={attachment} alt={alt} loading="lazy" role="button" tabIndex={0} onClick={openImage} onKeyDown={onImageKeyDown}/>{lightbox}</>;
 }
 return <a className="file-attachment" href={url||undefined} download={attachment.name} onClick={event=>{if(preview)event.preventDefault();}}><FileDown size={24}/><span><strong>{attachment.name}</strong><small>{(attachment.size/1024).toFixed(1)} KB · {preview?"Pronto para enviar":"Baixar arquivo"}</small></span></a>;
}
