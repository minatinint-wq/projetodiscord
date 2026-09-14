import React from "react";
import { Emoji, EmojiStyle } from "emoji-picker-react";

function emojiToUnified(emoji) {
  return Array.from(String(emoji || ""))
    .map((character) => character.codePointAt(0).toString(16))
    .join("-");
}

export default function EmojiArtwork({ emoji, size = 20 }) {
  return (
    <span className="emoji-artwork" aria-hidden="true">
      <Emoji
        unified={emojiToUnified(emoji)}
        emojiStyle={EmojiStyle.APPLE}
        size={size}
        lazyLoad
      />
    </span>
  );
}
