import React from "react"
import { PREMIUM_FRAME_ART } from "./premiumCosmetics"

export default function PremiumAvatarFrame({ frame }) {
  const src = PREMIUM_FRAME_ART[frame]
  if (!src) return null
  return <>
    <img className={"premium-avatar-frame premium-avatar-frame-" + frame} src={src} alt="" aria-hidden="true" />
    <span className={"premium-avatar-energy premium-avatar-energy-" + frame} aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--spark": index, "--angle": (index * 45) + "deg", "--spark-delay": (-index * .31) + "s" }} />)}
    </span>
  </>
}
