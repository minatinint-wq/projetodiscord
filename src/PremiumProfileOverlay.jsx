import React from "react"
import { PREMIUM_OVERLAY_ART } from "./premiumCosmetics"

export default function PremiumProfileOverlay({ effect }) {
  const src = PREMIUM_OVERLAY_ART[effect]
  if (!src) return null
  return <div className={"profile-overlay premium-profile-overlay premium-overlay-" + effect} aria-hidden="true">
    <img className="premium-overlay-art" src={src} alt="" />
    <span className="premium-overlay-light" />
    <span className="premium-overlay-particles">
      {Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--particle": index, "--particle-x": (4 + ((index % 3) * 45)) + "%", "--particle-top": (-8 + ((index % 6) * 18)) + "%", "--particle-duration": (5 + (index % 4)) + "s", "--particle-delay": (-index * .67) + "s" }} />)}
    </span>
  </div>
}
