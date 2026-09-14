import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emojiToUnified,
  graphemes,
  isEmojiCluster,
  splitEmojiParts,
} from "../src/emojiUtils.js";

test("unified usa zero-padding compatível com o datasource Apple", () => {
  assert.equal(emojiToUnified("😀"), "1f600");
  assert.equal(emojiToUnified("❤️"), "2764-fe0f");
  assert.equal(emojiToUnified("#️⃣"), "0023-fe0f-20e3");
  assert.equal(emojiToUnified("1️⃣"), "0031-fe0f-20e3");
  assert.equal(emojiToUnified("👨‍👩‍👧"), "1f468-200d-1f469-200d-1f467");
  assert.equal(emojiToUnified("🇧🇷"), "1f1e7-1f1f7");
});

test("detecta clusters de emoji sem engolir texto comum", () => {
  assert.equal(isEmojiCluster("😀"), true);
  assert.equal(isEmojiCluster("❤️"), true);
  assert.equal(isEmojiCluster("👨‍👩‍👧"), true);
  assert.equal(isEmojiCluster("🇧🇷"), true);
  assert.equal(isEmojiCluster("#️⃣"), true);
  assert.equal(isEmojiCluster("👍🏽"), true);
  assert.equal(isEmojiCluster("a"), false);
  assert.equal(isEmojiCluster("1"), false);
  assert.equal(isEmojiCluster("@"), false);
  assert.equal(isEmojiCluster(" "), false);
  assert.equal(isEmojiCluster("é"), false);
});

test("graphemes mantém ZWJ, tons e bandeiras inteiros", () => {
  assert.deepEqual(graphemes("a👨‍👩‍👧b"), ["a", "👨‍👩‍👧", "b"]);
  assert.deepEqual(graphemes("🇧🇷"), ["🇧🇷"]);
});

test("splitEmojiParts separa emoji do texto e agrupa o resto", () => {
  assert.deepEqual(splitEmojiParts("oi 😀 tudo bem? 🔥"), [
    { type: "text", value: "oi " },
    { type: "emoji", value: "😀" },
    { type: "text", value: " tudo bem? " },
    { type: "emoji", value: "🔥" },
  ]);
  assert.deepEqual(splitEmojiParts("sem emoji"), [
    { type: "text", value: "sem emoji" },
  ]);
  assert.deepEqual(splitEmojiParts(""), []);
});
