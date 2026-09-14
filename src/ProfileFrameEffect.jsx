import React from "react";
import { profileFrameLayers } from "../profile-frames";

export default function ProfileFrameEffect({ frame, preview = false }) {
  const layers = profileFrameLayers(frame);
  if (!layers.length) return null;

  return <span className={preview ? "profile-frame-effect profile-frame-preview" : "profile-frame-effect"} aria-hidden="true">
    {layers.map((src, index) => <img
      key={src}
      className="profile-frame-layer"
      src={src}
      alt=""
      draggable="false"
      decoding="async"
      loading={preview ? "lazy" : "eager"}
      data-edge={index % 2 === 0 ? "top" : "bottom"}
      style={{ "--frame-layer": index }}
      onLoad={(event) => {
        const image = event.currentTarget;
        const ratio = image.naturalWidth / Math.max(1, image.naturalHeight);
        image.dataset.edge = ratio < 0.9 ? "full" : ratio > 2.35 ? "bottom" : "top";
      }}
    />)}
  </span>;
}
