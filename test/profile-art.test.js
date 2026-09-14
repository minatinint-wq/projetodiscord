import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PROFILE_ART_EFFECTS, PROFILE_ART_IDS, profileArtFormat, profileArtSrc } from "../profile-art.js";
import { PROFILE_FRAMES, PROFILE_FRAME_IDS, profileFrameLayers } from "../profile-frames.js";

test("profile art catalog exposes APNGs and approved Discord references", () => {
  assert(PROFILE_ART_EFFECTS.length >= 38);
  assert.equal(PROFILE_ART_IDS.size, PROFILE_ART_EFFECTS.length);
  for (const [id, , file, format] of PROFILE_ART_EFFECTS.slice(1)) {
    const src = profileArtSrc(id);
    assert.equal(format, "apng", `${id} precisa usar a mídia animada do detalhe`);
    assert.equal(profileArtFormat(id), format);
    if (file.startsWith("https://")) {
      const url = new URL(src);
      assert.equal(url.protocol, "https:");
      assert.equal(url.hostname, "cdn.discordapp.com");
      assert.match(url.pathname, /^\/(?:media\/v1\/collectibles-shop|assets\/content)\/[a-f0-9]+$/);
      continue;
    }
    assert.equal(src, `/profile-art/${file}`);
    const bytes = fs.readFileSync(new URL(`../public/profile-art/${file}`, import.meta.url));
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert(bytes.includes(Buffer.from("acTL")), `${id} precisa ser APNG animado`);
  }
  assert.equal(profileArtSrc("none"), null);
  assert.equal(profileArtSrc("unknown"), null);
});

test("profile frame catalog keeps every product separate and uses layered Discord PNGs", () => {
  assert.equal(PROFILE_FRAMES.length, 39);
  assert.equal(PROFILE_FRAME_IDS.size, PROFILE_FRAMES.length);
  for (const [id, , layers] of PROFILE_FRAMES.slice(1)) {
    assert(layers.length >= 1 && layers.length <= 4, `${id} precisa ter de 1 a 4 camadas`);
    assert.deepEqual(profileFrameLayers(id), layers);
    for (const src of layers) {
      const url = new URL(src);
      assert.equal(url.protocol, "https:");
      assert.equal(url.hostname, "cdn.discordapp.com");
      assert.match(url.pathname, /^\/media\/v1\/collectibles-shop\/\d+\/\d+\/static$/);
    }
  }
  assert.deepEqual(profileFrameLayers("none"), []);
  assert.deepEqual(profileFrameLayers("unknown"), []);
});

