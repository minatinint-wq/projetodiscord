import React from "react"
import { PREMIUM_FRAME_APNG, PREMIUM_FRAME_ART, PREMIUM_FRAME_MOTION } from "./premiumCosmetics"
import AnimatedCosmetic from "./AnimatedCosmetic"

export default function PremiumAvatarFrame({ frame, animated = true }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [frame]);
  const src = PREMIUM_FRAME_ART[frame]
  const motion = PREMIUM_FRAME_MOTION[frame]
  const hue = [...frame].reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 360, 0)
  if (!src) return null
  const hide = () => setFailed(true);
  return <>
    <span className={"premium-avatar-frame-scene premium-avatar-frame-scene-" + frame} aria-hidden="true">
      {failed
        ? <span className="premium-avatar-frame-fallback" style={{"--frame-hue":hue}} />
        : PREMIUM_FRAME_APNG.has(frame)
        ? <img className={"premium-avatar-frame premium-avatar-frame-apng premium-avatar-frame-" + frame} src={src} alt="" loading="lazy" decoding="async" onError={hide} />
        : <>
          <img className={"premium-avatar-frame premium-avatar-frame-base premium-avatar-frame-" + frame} src={src} alt="" onError={hide} />
          {animated&&motion&&<AnimatedCosmetic src={motion} width={384} height={384} className="premium-avatar-frame premium-avatar-frame-motion" />}
        </>}
    </span>
  </>
}
