import React from "react";
import {StyledName,GameIcon} from "./ProfileIdentity";
import {GAME_CATALOG} from "../game-catalog";
import {bannerPresentation,profilePresentation} from "./profilePresentation";
import ProfileOverlay from "./ProfileOverlay";
import PremiumMotionCanvas from "./PremiumMotionCanvas";
import {PREMIUM_BANNER_IDS} from "./premiumCosmetics";
export default function ProfileCard({user,Avatar,ProfileEffectLayer,renderBadges,presence="offline"}){
 const games=(user.gameInterests||[]).map(id=>GAME_CATALOG.find(g=>g.id===id)).filter(Boolean);
 const bannerStyle=bannerPresentation(user),premiumBanner=PREMIUM_BANNER_IDS.has(user.bannerPreset);
 return <section className={"identity-card identity-plate-"+(user.profilePlate||"default")} style={profilePresentation(user)} data-effect={user.profileEffect||"none"}>
  <div className={"identity-banner "+(premiumBanner?"premium-banner premium-banner-"+user.bannerPreset:"")} style={bannerStyle}>{premiumBanner&&<><span className="premium-banner-parallax" style={bannerStyle}/><span className="premium-banner-flow"><b/><b/><b/></span><PremiumMotionCanvas theme={user.bannerPreset} mode="banner"/><span className="premium-banner-atmosphere">{Array.from({length:8},(_,index)=><i key={index} style={{"--particle":index,"--particle-x":((index*29)%96)+"%","--particle-y":((index*47)%90)+"%","--particle-duration":(3.8+(index%6)*.72)+"s","--particle-delay":(-index*.47)+"s"}}/>)}</span></>}</div>
  <ProfileEffectLayer effect={user.profileEffect}/>
  <ProfileOverlay effect={user.profileOverlay}/>
  <div className="identity-card-body">
   <div className="identity-avatar"><Avatar user={user}/><span className={"presence-dot presence-"+presence}/></div>
   {!!user.badges?.length&&<div className="identity-badges">{renderBadges?.(user)}</div>}
   <h2><StyledName user={user}/></h2><p className="identity-handle">@{user.username}{user.tag?"#"+user.tag:""}</p>
   <div className="identity-divider"/>
   <p className="identity-bio">{user.bio||"Cada perfil tem uma história. A sua começa aqui."}</p>
   {user.activityText&&<div className="identity-status"><i/>{user.activityText}</div>}
   {!!games.length&&<div className="identity-favorite"><GameIcon game={games[0]}/><span><small>JOGO FAVORITO</small><strong>{games[0].name}</strong></span></div>}
   {user.createdAt&&<p className="identity-date">No Sesh desde {new Date(user.createdAt).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</p>}
  </div>
 </section>;
}
