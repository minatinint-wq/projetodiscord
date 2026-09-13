import React,{useEffect,useRef} from "react"
import {createTimer} from "animejs"

const FRAME_COUNT=24
const COLUMNS=6

export default function AnimatedCosmetic({src,width,height,className=""}){
 const canvasRef=useRef(null)
 useEffect(()=>{
  const canvas=canvasRef.current
  if(!canvas||!src)return
  const context=canvas.getContext("2d",{alpha:true})
  const image=new Image()
  let timer=null,lastFrame=-1
  canvas.width=width;canvas.height=height
  const paint=frame=>{
   if(frame===lastFrame)return
   lastFrame=frame
   const sourceWidth=image.naturalWidth/COLUMNS
   const sourceHeight=image.naturalHeight/4
   context.clearRect(0,0,width,height)
   context.drawImage(image,(frame%COLUMNS)*sourceWidth,Math.floor(frame/COLUMNS)*sourceHeight,sourceWidth,sourceHeight,0,0,width,height)
  }
  image.onload=()=>{
   paint(0)
   timer=createTimer({
    duration:1200,
    frameRate:24,
    loop:true,
    onUpdate:self=>paint(Math.floor(self.iterationCurrentTime/50)%FRAME_COUNT),
   })
  }
  image.src=src
  return()=>{timer?.cancel();image.onload=null}
 },[src,width,height])
 return <canvas ref={canvasRef} className={className} data-animated-cosmetic={src} aria-hidden="true"/>
}
