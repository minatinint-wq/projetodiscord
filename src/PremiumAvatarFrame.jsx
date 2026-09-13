import React from "react"
import { PREMIUM_FRAME_ART, PREMIUM_FRAME_MOTION } from "./premiumCosmetics"
import AnimatedCosmetic from "./AnimatedCosmetic"

export default function PremiumAvatarFrame({ frame, animated = true }) {
  const src = PREMIUM_FRAME_ART[frame]
  const motion = PREMIUM_FRAME_MOTION[frame]
  if (!src) return null
  return <>
    <span className={"premium-avatar-frame-scene premium-avatar-frame-scene-" + frame} aria-hidden="true">
      <img className={"premium-avatar-frame premium-avatar-frame-base premium-avatar-frame-" + frame} src={src} alt="" />
      {animated&&<AnimatedCosmetic src={motion} width={384} height={384} className="premium-avatar-frame premium-avatar-frame-motion" />}
    </span>
  </>
}
