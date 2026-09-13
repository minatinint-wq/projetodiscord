import React from "react"
import { PREMIUM_FRAME_ART } from "./premiumCosmetics"

export default function PremiumAvatarFrame({ frame }) {
  const src = PREMIUM_FRAME_ART[frame]
  if (!src) return null
  return <>
    <span className={"premium-avatar-frame-scene premium-avatar-frame-scene-" + frame} aria-hidden="true">
      <img className={"premium-avatar-frame premium-avatar-frame-base premium-avatar-frame-" + frame} src={src} alt="" />
      <img className="premium-avatar-frame premium-avatar-frame-aura" src={src} alt="" />
      <img className="premium-avatar-frame premium-avatar-frame-scan" src={src} alt="" />
      <span className="premium-avatar-orbit premium-avatar-orbit-outer" />
      <span className="premium-avatar-orbit premium-avatar-orbit-inner" />
    </span>
    <span className={"premium-avatar-energy premium-avatar-energy-" + frame} aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--spark": index, "--angle": (index * 45) + "deg", "--spark-delay": (-index * .31) + "s" }} />)}
    </span>
  </>
}
