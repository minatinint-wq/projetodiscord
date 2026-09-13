import React,{useState,useEffect} from "react";
export function GameIcon({game}) {
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[game?.iconUrl]);
 if(!game)return null;
 return game.iconUrl&&!failed?<img className={"game-icon"+(/capsule|header|logo|wordmark/i.test(game.iconUrl)?" game-artwork-wide":"")} src={game.iconUrl} alt="" loading="lazy" onError={()=>setFailed(true)}/>:<span className="game-icon game-icon-fallback" style={{background:game.accent}} title={game.name}>{game.name.split(/\s+/).map(s=>s[0]).slice(0,2).join("")}</span>;
}
export function StyledName({user,children}) {
 const role=user?.serverRole;
 const roleClass=role?" role-effect-text role-style-"+(role.style||"solid"):"";
 return <span className={"styled-name name-effect-"+(user?.nameEffect||"solid")+" font-"+(user?.nameStyle||"default")+roleClass} style={{"--name-color":user?.nameColor||"#f1f3f5","--member-role-color":role?.color||"#f1f3f5"}}>{children||user?.displayName||user?.username}</span>;
}
