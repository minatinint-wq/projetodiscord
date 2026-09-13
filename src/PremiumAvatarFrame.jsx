import React from "react"
import { PREMIUM_FRAME_ART, PREMIUM_FRAME_MOTION } from "./premiumCosmetics"

export default function PremiumAvatarFrame({ frame }) {
  const src = PREMIUM_FRAME_ART[frame]
  const motion = PREMIUM_FRAME_MOTION[frame]
  if (!src) return null
  return <>
    <span className={"premium-avatar-frame-scene premium-avatar-frame-scene-" + frame} aria-hidden="true">
      <img className={"premium-avatar-frame premium-avatar-frame-base premium-avatar-frame-" + frame} src={src} alt="" />
      <img className="premium-avatar-frame premium-avatar-frame-motion" src={motion} alt="" />
    </span>
  </>
}
