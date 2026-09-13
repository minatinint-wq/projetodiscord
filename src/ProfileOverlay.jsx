import React from "react";
import PremiumProfileOverlay from "./PremiumProfileOverlay";
export default function ProfileOverlay({effect}){
 if(!effect||effect==="none")return null;
 if(["lunar-orbit","gothic-bloom","holo-circuit","sakura-shrine","steel-wolf","infernal-dragon"].includes(effect))return <PremiumProfileOverlay effect={effect}/>;
 return <div className={"profile-overlay overlay-"+effect} aria-hidden="true">
  <svg className="overlay-art" viewBox="0 0 400 600" preserveAspectRatio="none">
   {effect==="orbital"&&<g fill="none"><ellipse cx="205" cy="112" rx="188" ry="90"/><ellipse cx="205" cy="112" rx="176" ry="81"/><path d="M30 145 Q140 -40 360 50"/><circle cx="350" cy="152" r="5" fill="currentColor"/><path d="M12 510 Q210 670 390 490"/></g>}
   {effect==="runes"&&<g fill="none"><path d="M30 176V34H158M242 34H370V176M370 438V565H244M157 565H30V438"/><path d="M45 175V49H151M249 49H355V175M355 435V550H249M151 550H45V435" strokeDasharray="4 9"/><path d="M180 30l20-18 20 18-20 18zM180 570l20-18 20 18-20 18z"/></g>}
   {effect==="crystal"&&<g><path d="M0 80L38 34 22 140Z M400 125L355 65 375 189Z M0 490L43 553 17 600Z M400 425L354 547 400 585Z"/><path d="M16 45L59 75 29 108Z M383 4L341 48 387 91Z" opacity=".45"/></g>}
   {effect==="circuit"&&<g fill="none"><path d="M10 280V90L52 48H135M390 355V505L343 552H265M26 280V105L69 64H134M374 355V489L326 536H266"/><circle cx="141" cy="48" r="6"/><circle cx="258" cy="552" r="6"/><path d="M5 313H30M370 314H395M10 330H22M379 297H391"/></g>}
  </svg>
  {["nebula","petals"].includes(effect)&&Array.from({length:8},(_,i)=><i key={i} style={{"--orb-i":i,"--orb-x":(i%2?85:5)+(i%3)*3+"%","--orb-y":i*13+"%"}}/>)}
 </div>;
}
