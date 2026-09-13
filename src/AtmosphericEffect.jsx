import React,{useEffect,useRef} from "react";

const FIRE_EFFECTS=new Set(["embers","flames","blue_fire"]);
function spawn(type,width,height,initial=false){
 const fire=FIRE_EFFECTS.has(type), smoke=type==="smoke";
 return {
  x:Math.random()*width,
  y:initial?Math.random()*height:(fire||smoke?height+30:-20),
  size:smoke?28+Math.random()*58:fire?4+Math.random()*12:2+Math.random()*5,
  life:Math.random(),
  ttl:smoke?5+Math.random()*5:fire?2.6+Math.random()*3.5:5+Math.random()*5,
  vx:(Math.random()-.5)*(smoke?14:fire?20:24),
  vy:smoke?-(10+Math.random()*16):fire?-(25+Math.random()*52):14+Math.random()*22,
  phase:Math.random()*Math.PI*2,
  spin:(Math.random()-.5)*2,
 };
}
function flame(context,particle,type,alpha){
 const blue=type==="blue_fire",size=particle.size;
 const gradient=context.createRadialGradient(particle.x,particle.y,0,particle.x,particle.y,size*1.9);
 gradient.addColorStop(0,blue?"rgba(225,252,255,.95)":"rgba(255,242,174,.95)");
 gradient.addColorStop(.3,blue?"rgba(83,211,255,.8)":"rgba(255,128,42,.82)");
 gradient.addColorStop(.72,blue?"rgba(44,78,255,.28)":"rgba(220,38,23,.28)");
 gradient.addColorStop(1,"rgba(0,0,0,0)");
 context.globalAlpha=alpha;
 context.fillStyle=gradient;
 context.beginPath();
 context.ellipse(particle.x,particle.y,size*.72,size*2.1,-particle.vx*.015,0,Math.PI*2);
 context.fill();
}
export default function AtmosphericEffect({type}){
 const canvasRef=useRef(null);
 useEffect(()=>{
  const canvas=canvasRef.current;
  if(!canvas||matchMedia("(prefers-reduced-motion: reduce)").matches||document.documentElement.dataset.reducedMotion==="true")return;
  const context=canvas.getContext("2d",{alpha:true});
  let frame=0,last=performance.now(),visible=true,width=1,height=1,particles=[];
  const count=type==="smoke"?14:type==="ash"?18:type==="embers"?24:20;
  const resize=()=>{
   const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
   width=Math.max(1,rect.width);height=Math.max(1,rect.height);
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
   context.setTransform(dpr,0,0,dpr,0,0);
   particles=Array.from({length:count},()=>spawn(type,width,height,true));
  };
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;},{rootMargin:"80px"});
  visibilityObserver.observe(canvas);
  const draw=now=>{
   const dt=Math.min(.04,(now-last)/1000);last=now;
   if(visible){
    context.clearRect(0,0,width,height);
    const speed=Math.max(.65,Number.parseFloat(getComputedStyle(canvas).getPropertyValue("--profile-effect-speed"))||1);
    for(let index=0;index<particles.length;index++){
     let particle=particles[index];
     particle.life+=dt/speed;particle.phase+=dt*(.7+index%4*.13);
     particle.x+=(particle.vx+Math.sin(particle.phase)*10)*dt/speed;
     particle.y+=particle.vy*dt/speed;
     const progress=(particle.life%particle.ttl)/particle.ttl;
     const alpha=Math.sin(Math.PI*Math.min(1,progress))*Math.min(1,progress*5);
     if(type==="smoke"){
      const radius=particle.size*(.65+progress*1.35);
      const gradient=context.createRadialGradient(particle.x,particle.y,0,particle.x,particle.y,radius);
      gradient.addColorStop(0,`rgba(178,184,194,${.14*alpha})`);
      gradient.addColorStop(.42,`rgba(93,98,108,${.11*alpha})`);
      gradient.addColorStop(1,"rgba(30,31,36,0)");
      context.fillStyle=gradient;context.beginPath();context.arc(particle.x,particle.y,radius,0,Math.PI*2);context.fill();
     }else if(type==="ash"){
      context.save();context.translate(particle.x,particle.y);context.rotate(particle.phase*particle.spin);
      context.globalAlpha=.42*alpha;context.fillStyle=index%3?"#98928c":"#d0c5bb";
      context.fillRect(-particle.size/2,-1,particle.size,1.5);context.restore();
     }else if(type==="embers"){
      if(index<8){
       const radius=18+progress*38,gradient=context.createRadialGradient(particle.x,particle.y,0,particle.x,particle.y,radius);
       gradient.addColorStop(0,`rgba(108,108,113,${.08*alpha})`);gradient.addColorStop(1,"rgba(20,20,22,0)");
       context.fillStyle=gradient;context.beginPath();context.arc(particle.x,particle.y,radius,0,Math.PI*2);context.fill();
      }else{
       context.save();context.translate(particle.x,particle.y);context.rotate(Math.atan2(particle.vy,particle.vx)-Math.PI/2);
       const gradient=context.createLinearGradient(0,0,0,particle.size*4);
       gradient.addColorStop(0,"rgba(255,245,184,0)");gradient.addColorStop(.62,`rgba(255,126,38,${.48*alpha})`);gradient.addColorStop(1,`rgba(255,50,20,${alpha})`);
       context.fillStyle=gradient;context.shadowColor="#ff542d";context.shadowBlur=8;context.fillRect(-.7,0,1.4,particle.size*4);context.restore();
      }
     }else flame(context,particle,type,alpha);
     if(particle.life>=particle.ttl||particle.y<-100||particle.y>height+100||particle.x<-100||particle.x>width+100)particles[index]=spawn(type,width,height);
    }
    context.globalAlpha=1;context.shadowBlur=0;
   }
   frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);resizeObserver.disconnect();visibilityObserver.disconnect();};
 },[type]);
 return <canvas ref={canvasRef} className={"profile-atmosphere profile-atmosphere-"+type} aria-hidden="true"/>;
}
