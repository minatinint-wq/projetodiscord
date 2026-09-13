import React,{useEffect,useState} from "react";
import {Eye,EyeOff,FileDown} from "lucide-react";
export default function AttachmentView({attachment,preview=false,alt="Imagem enviada",nsfw=false}){
 const [url,setUrl]=useState("");
 const [revealed,setRevealed]=useState(false);
 useEffect(()=>{
  if(!attachment||typeof attachment==="string"){setUrl("");return;}
  const bytes=Uint8Array.from(atob(attachment.data.split(",")[1]),c=>c.charCodeAt(0));
  const link=URL.createObjectURL(new Blob([bytes],{type:"application/octet-stream"}));
  setUrl(link);return()=>URL.revokeObjectURL(link);
 },[attachment]);
 if(!attachment)return null;
 if(typeof attachment==="string"){
  if(nsfw&&!preview)return <div className={`nsfw-attachment${revealed?" is-revealed":""}`}><img className={`message-attachment nsfw-image${revealed?" revealed":""}`} src={attachment} alt={alt} loading="lazy"/><span className="nsfw-label">Conteúdo NSFW</span><button className="nsfw-toggle" type="button" aria-label={revealed?"Ocultar imagem NSFW":"Revelar imagem NSFW"} aria-pressed={revealed} onClick={()=>setRevealed(current=>!current)}>{revealed?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>;
  return <img className={preview?"composer-attachment-preview":"message-attachment"} src={attachment} alt={alt} loading={preview?"eager":"lazy"}/>;
 }
 return <a className="file-attachment" href={url||undefined} download={attachment.name} onClick={event=>{if(preview)event.preventDefault();}}><FileDown size={24}/><span><strong>{attachment.name}</strong><small>{(attachment.size/1024).toFixed(1)} KB · {preview?"Pronto para enviar":"Baixar arquivo"}</small></span></a>;
}
