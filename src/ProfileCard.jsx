import React from "react";
import {StyledName,GameIcon} from "./ProfileIdentity";
import {GAME_CATALOG} from "../game-catalog";
import {bannerPresentation,profilePresentation} from "./profilePresentation";
import ProfileOverlay from "./ProfileOverlay";
import {PREMIUM_BANNER_IDS,PREMIUM_BANNER_MOTION} from "./premiumCosmetics";
import AnimatedCosmetic from "./AnimatedCosmetic";
export default function ProfileCard({user,Avatar,ProfileEffectLayer,renderBadges,presence="offline"}){
 const games=(user.gameInterests||[]).map(id=>GAME_CATALOG.find(game=>game.id===id)).filter(Boolean);
 const bannerStyle=bannerPresentation(user),premiumBanner=PREMIUM_BANNER_IDS.has(user.bannerPreset);
 const role=user.serverRole;
 return <section className="identity-card" style={profilePresentation(user)} data-effect={user.profileEffect||"none"}>
  <div className={"identity-banner "+(premiumBanner?"premium-banner premium-banner-"+user.bannerPreset:"")} style={bannerStyle}>{premiumBanner&&<AnimatedCosmetic className="premium-banner-motion" src={PREMIUM_BANNER_MOTION[user.bannerPreset]} width={720} height={240}/>}</div>
  <ProfileEffectLayer effect={user.profileEffect}/>
  <ProfileOverlay effect={user.profileOverlay}/>
  <div className="identity-card-body">
   <div className="identity-avatar"><Avatar user={user}/><span className={"presence-dot presence-"+presence}/></div>
   {!!user.badges?.length&&<div className="identity-badges">{renderBadges?.(user)}</div>}
   <h2><StyledName user={user}/></h2><p className="identity-handle">@{user.username}</p>
   {role&&<div className="profile-role-list"><span className={"profile-role-badge role-style-"+(role.style||"solid")} style={{"--role-color":role.color,"--member-role-color":role.color}}>{role.icon?<img src={role.icon} alt=""/>:role.emoji?<span className="role-emoji" aria-hidden="true">{role.emoji}</span>:<i/>}<span className="role-effect-text">{role.name}</span></span></div>}
   <div className="identity-divider"/>
   <p className="identity-bio">{user.bio||"Cada perfil tem uma história. A sua começa aqui."}</p>
   {user.activityText&&<div className="identity-status"><i/>{user.activityText}</div>}
   {!!games.length&&<div className="identity-favorite"><GameIcon game={games[0]}/><span><small>JOGO FAVORITO</small><strong>{games[0].name}</strong></span></div>}
   {user.createdAt&&<p className="identity-date">No Sesh desde {new Date(user.createdAt).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</p>}
  </div>
 </section>;
}
