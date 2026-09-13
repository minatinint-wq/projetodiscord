import React,{useEffect,useRef} from "react"

const FAMILY={
 "lunar-orbit":"lunar","celestial-tide":"lunar",
 "gothic-bloom":"gothic","crimson-eclipse":"gothic",
 "sakura-shrine":"sakura","sakura-dawn":"sakura",
 "holo-circuit":"cyber","neon-pulse":"cyber",
 "steel-wolf":"steel","infernal-dragon":"infernal",
}

function seeded(seed){
 let value=seed>>>0
 return()=>{value=(value+0x6D2B79F5)|0;let result=Math.imul(value^(value>>>15),1|value);result^=result+Math.imul(result^(result>>>7),61|result);return((result^(result>>>14))>>>0)/4294967296}
}
function rgba(hex,alpha){
 const value=parseInt(hex.slice(1),16)
 return "rgba("+((value>>16)&255)+","+((value>>8)&255)+","+(value&255)+","+alpha+")"
}
function petal(ctx,x,y,size,rotation,color){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(size,size*.62)
 const gradient=ctx.createRadialGradient(-.18,-.15,.05,0,0,1)
 gradient.addColorStop(0,"rgba(255,255,255,.96)");gradient.addColorStop(.34,color);gradient.addColorStop(1,"rgba(234,91,155,.16)")
 ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(0,-1);ctx.bezierCurveTo(.95,-.62,1.05,.25,0,1);ctx.bezierCurveTo(-1.05,.25,-.95,-.62,0,-1);ctx.fill();ctx.restore()
}
function glowDot(ctx,x,y,r,color,alpha=1){
 const gradient=ctx.createRadialGradient(x,y,0,x,y,r*3)
 gradient.addColorStop(0,rgba(color,alpha));gradient.addColorStop(.28,rgba(color,alpha*.6));gradient.addColorStop(1,rgba(color,0))
 ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,r*3,0,Math.PI*2);ctx.fill()
}
function lightning(ctx,random,w,h,time,color,side){
 const xBase=side==="left"?w*.04:w*.96
 const direction=side==="left"?1:-1
 const yStart=((time*46)+(side==="left"?0:h*.43))%(h*1.35)-h*.18
 ctx.save();ctx.strokeStyle=rgba(color,.72);ctx.lineWidth=Math.max(1,w/620);ctx.shadowColor=color;ctx.shadowBlur=10
 ctx.beginPath();ctx.moveTo(xBase,yStart)
 for(let step=1;step<=6;step++)ctx.lineTo(xBase+direction*(random()*18+step*2),yStart+step*h*.055)
 ctx.stroke();ctx.restore()
}

export default function PremiumMotionCanvas({theme,mode="overlay"}){
 const ref=useRef(null)
 useEffect(()=>{
  const canvas=ref.current
  if(!canvas)return
  const ctx=canvas.getContext("2d",{alpha:true})
  const family=FAMILY[theme]||"lunar"
  const random=seeded([...theme+mode].reduce((sum,char)=>sum+char.charCodeAt(0)*17,71))
  const count=mode==="banner"?16:28
  const particles=Array.from({length:count},()=>({x:random(),y:random(),depth:.45+random()*.9,speed:.35+random()*.85,phase:random()*Math.PI*2,spin:(random()-.5)*2.2}))
  let width=1,height=1,dpr=1,frame=0,last=0,visible=true
  const resize=()=>{
   const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);dpr=Math.min(2,window.devicePixelRatio||1)
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)
  }
  const drawSakura=time=>{
   particles.forEach((particle,index)=>{
    const travel=(particle.y+time*particle.speed*.055)%1.18-.08
    const x=(particle.x*width+Math.sin(time*.72+particle.phase)*width*.075+travel*width*.12)%width
    const y=travel*height
    const size=(3.2+particle.depth*3.8)*(mode==="banner"?.72:1)
    petal(ctx,x,y,size,time*particle.spin+particle.phase,index%3===0?"rgba(255,220,236,.94)":"rgba(255,145,193,.88)")
   })
  }
  const drawLunar=time=>{
   ctx.save();ctx.translate(width*.5,height*.48);ctx.strokeStyle="rgba(161,203,255,.22)";ctx.lineWidth=1
   for(let ring=0;ring<3;ring++){ctx.save();ctx.rotate(time*(.045+ring*.016)*(ring%2?1:-1));ctx.scale(1,.34+ring*.08);ctx.beginPath();ctx.arc(0,0,Math.min(width,height)*(mode==="banner"?.65:.43)+ring*16,0,Math.PI*1.48);ctx.stroke();ctx.restore()}
   ctx.restore()
   particles.forEach((particle,index)=>{
    const pulse=.38+.62*Math.pow(Math.sin(time*(.7+particle.speed*.3)+particle.phase)*.5+.5,3)
    glowDot(ctx,particle.x*width,particle.y*height,1.1+particle.depth*1.35,index%4===0?"#d9b8ff":"#b9dcff",pulse)
    if(index%7===0){ctx.strokeStyle="rgba(231,241,255,"+(pulse*.72)+")";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(particle.x*width-5*particle.depth,particle.y*height);ctx.lineTo(particle.x*width+5*particle.depth,particle.y*height);ctx.moveTo(particle.x*width,particle.y*height-5*particle.depth);ctx.lineTo(particle.x*width,particle.y*height+5*particle.depth);ctx.stroke()}
   })
  }
  const drawGothic=time=>{
   ctx.save();ctx.globalCompositeOperation="screen"
   for(let index=0;index<7;index++){const side=index%2;const x=(side?.88:.12)*width+Math.sin(time*.19+index)*width*.07;const y=((index*.19+time*.018*(index%3+1))%1.3-.15)*height;const radius=Math.max(24,width*(.055+index*.006));const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);gradient.addColorStop(0,"rgba(160,12,42,.16)");gradient.addColorStop(.45,"rgba(88,8,31,.11)");gradient.addColorStop(1,"rgba(32,0,12,0)");ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.46,Math.sin(time*.1+index)*.35,0,Math.PI*2);ctx.fill()}
   ctx.restore()
   particles.slice(0,14).forEach((particle,index)=>{const travel=(particle.y-time*particle.speed*.035+2)%1.1;const x=particle.x*width;const y=travel*height;glowDot(ctx,x,y,1.2+particle.depth,index%3?"#ff3b45":"#ff9a73",.55)})
  }
  const drawCyber=time=>{
   const scan=(time*.105%1.3-.15)*height
   const gradient=ctx.createLinearGradient(0,scan-18,0,scan+18);gradient.addColorStop(0,"rgba(39,224,255,0)");gradient.addColorStop(.5,"rgba(104,241,255,.30)");gradient.addColorStop(1,"rgba(144,70,255,0)");ctx.fillStyle=gradient;ctx.fillRect(0,scan-18,width,36)
   ctx.save();ctx.strokeStyle="rgba(81,225,255,.22)";ctx.lineWidth=1
   const grid=Math.max(26,width/12),offset=(time*12)%grid
   for(let x=-grid+offset;x<width;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke()}
   for(let y=0;y<height;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}
   ctx.restore()
   particles.slice(0,12).forEach((particle,index)=>{const x=((particle.x+time*.035*particle.speed)%1)*width;const y=particle.y*height;glowDot(ctx,x,y,1.4,index%2?"#42efff":"#b36cff",.8)})
  }
  const drawSteel=time=>{
   const liveRandom=seeded(Math.floor(time*7)+197)
   lightning(ctx,liveRandom,width,height,time,"#72b8ff","left");lightning(ctx,liveRandom,width,height,time+.8,"#dcecff","right")
   particles.slice(0,16).forEach((particle,index)=>{const travel=(particle.y-time*particle.speed*.055+2)%1.1;const x=particle.x*width+Math.sin(time+particle.phase)*9;const y=travel*height;ctx.fillStyle=index%4===0?"rgba(217,237,255,.9)":"rgba(87,154,237,.65)";ctx.save();ctx.translate(x,y);ctx.rotate(-.65);ctx.fillRect(-particle.depth*3,-.45,particle.depth*6,.9);ctx.restore()})
  }
  const drawInfernal=time=>{
   const base=mode==="banner"?height*.96:height
   for(let index=0;index<9;index++){const x=(index+1)*width/10;const sway=Math.sin(time*(1.15+index*.03)+index)*8;const flameHeight=height*(.08+(index%4)*.017);const gradient=ctx.createLinearGradient(0,base,0,base-flameHeight);gradient.addColorStop(0,"rgba(255,38,8,.48)");gradient.addColorStop(.5,"rgba(255,105,24,.30)");gradient.addColorStop(1,"rgba(255,202,74,0)");ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(x-12,base);ctx.bezierCurveTo(x-18+sway,base-flameHeight*.35,x+9+sway,base-flameHeight*.62,x+sway*.25,base-flameHeight);ctx.bezierCurveTo(x+24+sway,base-flameHeight*.48,x+13,base-flameHeight*.25,x+12,base);ctx.closePath();ctx.fill()}
   particles.slice(0,20).forEach((particle,index)=>{const travel=(particle.y-time*particle.speed*.075+2)%1.15;const x=particle.x*width+Math.sin(time*1.4+particle.phase)*13;const y=travel*height;glowDot(ctx,x,y,1+particle.depth*.9,index%4===0?"#ffd06a":"#ff4b22",.72)})
  }
  const draw=now=>{
   frame=requestAnimationFrame(draw)
   if(!visible||now-last<16)return
   last=now;ctx.clearRect(0,0,width,height)
   const time=now/1000
   if(family==="sakura")drawSakura(time)
   else if(family==="lunar")drawLunar(time)
   else if(family==="gothic")drawGothic(time)
   else if(family==="cyber")drawCyber(time)
   else if(family==="steel")drawSteel(time)
   else drawInfernal(time)
  }
  resize()
  const resizeObserver=new ResizeObserver(resize),intersectionObserver=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false})
  resizeObserver.observe(canvas);intersectionObserver.observe(canvas);frame=requestAnimationFrame(draw)
  return()=>{cancelAnimationFrame(frame);resizeObserver.disconnect();intersectionObserver.disconnect()}
 },[theme,mode])
 return <canvas ref={ref} className={"premium-motion-canvas premium-motion-"+mode+" premium-motion-"+(FAMILY[theme]||"lunar")} data-motion-theme={theme} data-motion-mode={mode}/>
}
