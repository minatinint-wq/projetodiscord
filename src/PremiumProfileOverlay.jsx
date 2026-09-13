import React from "react"
import { PREMIUM_OVERLAY_ART, PREMIUM_OVERLAY_MOTION } from "./premiumCosmetics"
import AnimatedCosmetic from "./AnimatedCosmetic"

export default function PremiumProfileOverlay({ effect, animated = true }) {
  const src = PREMIUM_OVERLAY_ART[effect]
  const motion = PREMIUM_OVERLAY_MOTION[effect]
  if (!src) return null
  return <div className={"profile-overlay premium-profile-overlay premium-overlay-" + effect} aria-hidden="true">
    <img className="premium-overlay-art premium-overlay-art-base" src={src} alt="" />
    {animated&&<AnimatedCosmetic src={motion} width={480} height={720} className="premium-overlay-art premium-overlay-motion" />}
  </div>
}
