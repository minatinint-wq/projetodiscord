import React, { memo, useState } from "react";
import { APPLE_EMOJI_CDN, emojiToUnified, splitEmojiParts } from "./emojiUtils";

// Mesma arte Apple do seletor (emoji-datasource-apple via CDN). Se a imagem
// falhar (emoji novo, CDN fora do ar, app desktop offline), cai para o
// caractere nativo em vez de sumir.
function EmojiImage({ cluster }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="emoji-native-fallback">{cluster}</span>;
  return (
    <img
      className="emoji-img"
      src={`${APPLE_EMOJI_CDN}${emojiToUnified(cluster)}.png`}
      alt={cluster}
      draggable={false}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function EmojiText({ text }) {
  const parts = splitEmojiParts(text);
  return (
    <>
      {parts.map((part, index) =>
        part.type === "emoji" ? (
          <EmojiImage key={index} cluster={part.value} />
        ) : (
          <React.Fragment key={index}>{part.value}</React.Fragment>
        ),
      )}
    </>
  );
}

export default memo(EmojiText);
