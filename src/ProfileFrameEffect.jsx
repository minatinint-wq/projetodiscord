import React from "react";
import { profileFrameLayout, profileFrameVariables } from "../profile-frames";

export default function ProfileFrameEffect({ frame, preview = false }) {
  const layout = profileFrameLayout(frame);
  if (!layout?.layers.length) return null;

  return <span className={preview ? "profile-frame-effect profile-frame-preview" : "profile-frame-effect"} style={profileFrameVariables(frame)} aria-hidden="true">
    {layout.layers.map((layer, index) => <img
      key={`${layer.src}-${layer.role}-${layer.edge}`}
      className="profile-frame-layer"
      src={layer.src}
      alt=""
      draggable="false"
      decoding="async"
      loading={preview ? "lazy" : "eager"}
      data-edge={layer.edge}
      data-role={layer.role}
      style={{ "--frame-layer": index }}
    />)}
  </span>;
}
