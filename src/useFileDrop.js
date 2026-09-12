import {useState,useRef} from "react";
export default function useFileDrop(onFiles){
 const [dragging,setDragging]=useState(false),depth=useRef(0);
 const isFiles=event=>Array.from(event.dataTransfer?.types||[]).includes("Files");
 return {dragging,bind:{
  onDragEnter:event=>{if(!isFiles(event))return;event.preventDefault();event.stopPropagation();depth.current++;setDragging(true);},
  onDragOver:event=>{if(!isFiles(event))return;event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect="copy";},
  onDragLeave:event=>{event.stopPropagation();if(--depth.current<=0){depth.current=0;setDragging(false);}},
  onDrop:event=>{if(!isFiles(event))return;event.preventDefault();event.stopPropagation();depth.current=0;setDragging(false);onFiles(Array.from(event.dataTransfer.files));}
 }};
}
