import React from "react";
import {StyledName,GameIcon} from "./ProfileIdentity";
import {GAME_CATALOG} from "../game-catalog";
import {bannerPresentation,profilePresentation} from "./profilePresentation";
import ProfileOverlay from "./ProfileOverlay";
import {PREMIUM_BANNER_IDS,PREMIUM_BANNER_MOTION} from "./premiumCosmetics";
import AnimatedCosmetic from "./AnimatedCosmetic";
import {NAMEPLATE_FILES, nameplateSrc} from "../nameplates";
export default function ProfileCard({user,Avatar,ProfileEffectLayer,renderBadges,presence="offline"}){
 const games=(user.gameInterests||[]).map(id=>GAME_CATALOG.find(game=>game.id===id)).filter(Boolean);
 const bannerStyle=bannerPresentation(user),premiumBanner=PREMIUM_BANNER_IDS.has(user.bannerPreset);
 const nameplateVideo=NAMEPLATE_FILES[user.profilePlate]?nameplateSrc(user.profilePlate):null;
 return <section className={"identity-card identity-plate-"+(nameplateVideo?"nameplate":(user.profilePlate||"default"))} style={profilePresentation(user)} data-effect={user.profileEffect||"none"}>
  {nameplateVideo&&<video className="identity-nameplate-video" src={nameplateVideo} autoPlay loop muted playsInline aria-hidden="true"/>}
  <div className={"identity-banner "+(premiumBanner?"premium-banner premium-banner-"+user.bannerPreset:"")} style={bannerStyle}>{premiumBanner&&<AnimatedCosmetic className="premium-banner-motion" src={PREMIUM_BANNER_MOTION[user.bannerPreset]} width={720} height={240}/>}</div>
  <ProfileEffectLayer effect={user.profileEffect}/>
  <ProfileOverlay effect={user.profileOverlay}/>
  <div className="identity-card-body">
   <div className="identity-avatar"><Avatar user={user}/><span className={"presence-dot presence-"+presence}/></div>
   {!!user.badges?.length&&<div className="identity-badges">{renderBadges?.(user)}</div>}
   <h2><StyledName user={user}/></h2><p className="identity-handle">@{user.username}</p>
   <div className="identity-divider"/>
   <p className="identity-bio">{user.bio||"Cada perfil tem uma história. A sua começa aqui."}</p>
   {user.activityText&&<div className="identity-status"><i/>{user.activityText}</div>}
   {!!games.length&&<div className="identity-favorite"><GameIcon game={games[0]}/><span><small>JOGO FAVORITO</small><strong>{games[0].name}</strong></span></div>}
   {user.createdAt&&<p className="identity-date">No Sesh desde {new Date(user.createdAt).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</p>}
  </div>
 </section>;
}
