import React from "react"
import { PREMIUM_OVERLAY_ART } from "./premiumCosmetics"
import PremiumMotionCanvas from "./PremiumMotionCanvas"

export default function PremiumProfileOverlay({ effect }) {
  const src = PREMIUM_OVERLAY_ART[effect]
  if (!src) return null
  return <div className={"profile-overlay premium-profile-overlay premium-overlay-" + effect} aria-hidden="true">
    <img className="premium-overlay-art premium-overlay-art-base" src={src} alt="" />
    <img className="premium-overlay-art premium-overlay-art-aura" src={src} alt="" />
    <img className="premium-overlay-art premium-overlay-art-scan" src={src} alt="" />
    <span className="premium-overlay-depth"><b/><b/><b/></span>
    <PremiumMotionCanvas theme={effect} mode="overlay" />
    <span className="premium-overlay-light" />
    <span className="premium-overlay-particles">
      {Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--particle": index, "--particle-x": (3 + ((index * 37) % 94)) + "%", "--particle-top": (-12 + ((index * 23) % 106)) + "%", "--particle-duration": (4.8 + (index % 6) * .7) + "s", "--particle-delay": (-index * .53) + "s", "--particle-scale": .65 + (index % 4) * .22 }} />)}
    </span>
  </div>
}
