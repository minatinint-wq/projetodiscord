import React from "react"
import { PREMIUM_OVERLAY_ART, PREMIUM_OVERLAY_MOTION } from "./premiumCosmetics"

export default function PremiumProfileOverlay({ effect }) {
  const src = PREMIUM_OVERLAY_ART[effect]
  const motion = PREMIUM_OVERLAY_MOTION[effect]
  if (!src) return null
  return <div className={"profile-overlay premium-profile-overlay premium-overlay-" + effect} aria-hidden="true">
    <img className="premium-overlay-art premium-overlay-art-base" src={src} alt="" />
    <img className="premium-overlay-art premium-overlay-motion" src={motion} alt="" />
  </div>
}
