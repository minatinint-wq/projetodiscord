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
  let timer=null,observer=null,lastFrame=-1,loaded=false,visible=typeof IntersectionObserver==="undefined"
  canvas.width=width;canvas.height=height
  const paint=frame=>{
   if(frame===lastFrame)return
   lastFrame=frame
   const sourceWidth=image.naturalWidth/COLUMNS
   const sourceHeight=image.naturalHeight/4
   context.clearRect(0,0,width,height)
   context.drawImage(image,(frame%COLUMNS)*sourceWidth,Math.floor(frame/COLUMNS)*sourceHeight,sourceWidth,sourceHeight,0,0,width,height)
  }
  const start=()=>{
   if(!loaded||!visible)return
   if(timer){timer.resume();canvas.dataset.animationState="running";return}
   const speed=Math.max(.5,Number.parseFloat(getComputedStyle(canvas).getPropertyValue("--profile-effect-speed"))||1)
   const duration=2400*speed
   timer=createTimer({duration,frameRate:24,loop:true,onUpdate:self=>paint(Math.floor(self.iterationCurrentTime/(duration/FRAME_COUNT))%FRAME_COUNT)})
   canvas.dataset.animationState="running"
  }
  image.onload=()=>{
   loaded=true
   paint(0)
   start()
  }
  if(typeof IntersectionObserver!=="undefined"){
   observer=new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting
    if(visible)start()
    else if(timer){timer.pause();canvas.dataset.animationState="paused"}
   },{threshold:.02})
   observer.observe(canvas)
  }
  image.src=src
  return()=>{observer?.disconnect();timer?.cancel();image.onload=null}
 },[src,width,height])
 return <canvas ref={canvasRef} className={className} data-animated-cosmetic={src} aria-hidden="true"/>
}
