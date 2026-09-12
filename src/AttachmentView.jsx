import React,{useEffect,useState} from "react";
import {FileDown} from "lucide-react";
export default function AttachmentView({attachment,preview=false,alt="Imagem enviada"}){
 const [url,setUrl]=useState("");
 useEffect(()=>{
  if(!attachment||typeof attachment==="string"){setUrl("");return;}
  const bytes=Uint8Array.from(atob(attachment.data.split(",")[1]),c=>c.charCodeAt(0));
  const link=URL.createObjectURL(new Blob([bytes],{type:"application/octet-stream"}));
  setUrl(link);return()=>URL.revokeObjectURL(link);
 },[attachment]);
 if(!attachment)return null;
 if(typeof attachment==="string")return <img className={preview?"composer-attachment-preview":"message-attachment"} src={attachment} alt={alt} loading={preview?"eager":"lazy"}/>;
 return <a className="file-attachment" href={url||undefined} download={attachment.name} onClick={event=>{if(preview)event.preventDefault();}}><FileDown size={24}/><span><strong>{attachment.name}</strong><small>{(attachment.size/1024).toFixed(1)} KB · {preview?"Pronto para enviar":"Baixar arquivo"}</small></span></a>;
}
