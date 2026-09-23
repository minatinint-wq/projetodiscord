import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PROFILE_ART_EFFECTS, PROFILE_ART_IDS, profileArtFormat, profileArtSrc, profileArtSources, profileArtVariantCount } from "../profile-art.js";
import { PROFILE_FRAMES, PROFILE_FRAME_IDS, profileFrameLayout, profileFrameLayers, profileFrameVariables } from "../profile-frames.js";

test("profile art catalog exposes APNGs and approved Discord references", () => {
  assert.equal(PROFILE_ART_EFFECTS.length, 81, "catálogo deve ter 80 efeitos além de Sem efeito");
  assert.equal(PROFILE_ART_IDS.size, PROFILE_ART_EFFECTS.length);
  for (const [id, , source, format] of PROFILE_ART_EFFECTS.slice(1)) {
    const src = profileArtSrc(id);
    assert.equal(format, "apng", `${id} precisa usar a mídia animada do detalhe`);
    assert.equal(profileArtFormat(id), format);
    const files = Array.isArray(source) ? source : [source];
    assert.equal(profileArtVariantCount(id), files.length);
    assert.deepEqual(profileArtSources(id), files.map((file) => file.startsWith("https://") ? file : `/profile-art/${file}`));
    for (const [variant, file] of files.entries()) {
      const variantSrc = profileArtSrc(id, variant);
      if (file.startsWith("https://")) {
        const url = new URL(variantSrc);
        assert.equal(url.protocol, "https:");
        assert.equal(url.hostname, "cdn.discordapp.com");
        assert.match(url.pathname, /^\/(?:media\/v1\/collectibles-shop|assets\/content)\/[a-f0-9]+$/);
        continue;
      }
      assert.equal(variantSrc, `/profile-art/${file}`);
      const bytes = fs.readFileSync(new URL(`../public/profile-art/${file}`, import.meta.url));
      assert.equal(bytes.subarray(1, 4).toString(), "PNG");
      assert(bytes.includes(Buffer.from("acTL")), `${id} precisa ser APNG animado`);
    }
  }
  assert.equal(profileArtVariantCount("mothman"), 4);
  assert.equal(profileArtVariantCount("abundant-roses-red"), 2);
  assert.equal(profileArtSrc("mothman", 4), profileArtSrc("mothman", 0));
  assert.equal(profileArtSrc("none"), null);
  assert.equal(profileArtSrc("unknown"), null);
  assert.deepEqual(profileArtSources("unknown"), []);
});

test("profile frame catalog keeps every product separate and uses layered Discord PNGs", () => {
  assert.equal(PROFILE_FRAMES.length, 61);
  assert.equal(PROFILE_FRAME_IDS.size, PROFILE_FRAMES.length);
  for (const [id, , layers] of PROFILE_FRAMES.slice(1)) {
    assert(layers.length >= 1 && layers.length <= 4, `${id} precisa ter de 1 a 4 camadas`);
    assert.deepEqual(profileFrameLayers(id), layers);
    const layout = profileFrameLayout(id);
    assert(layout, `${id} precisa ter geometria própria`);
    assert.deepEqual(layout.layers.map((layer) => layer.src), layers);
    assert(layout.layers.every((layer) => ["front", "back"].includes(layer.role)));
    assert(layout.layers.every((layer) => ["top", "bottom"].includes(layer.edge)));
    assert(layout.containerWidth > 0);
    assert(layout.overflowHorizontal >= 0);
    assert(layout.overflowTop >= 0);
    assert(layout.overflowBottom >= 0);
    assert.match(profileFrameVariables(id)["--profile-frame-render-width"], /%$/);
    for (const src of layers) {
      const url = new URL(src);
      assert.equal(url.protocol, "https:");
      assert.equal(url.hostname, "cdn.discordapp.com");
      assert.match(url.pathname, /^\/media\/v1\/collectibles-shop\/\d+\/\d+\/static$/);
    }
  }
  assert.deepEqual(profileFrameLayers("none"), []);
  assert.deepEqual(profileFrameLayers("unknown"), []);
  assert.equal(profileFrameLayout("none"), null);
  assert.deepEqual(profileFrameVariables("unknown"), {});
});

test("profile frame metadata preserves official layer roles", () => {
  assert.deepEqual(profileFrameLayout("dark-roses-black").layers.map(({ role, edge }) => [role, edge]), [["front", "top"], ["front", "bottom"]]);
  assert.deepEqual(profileFrameLayout("fantasy-galaxy-white").layers.map(({ role, edge }) => [role, edge]), [["front", "top"], ["back", "top"]]);
  assert.deepEqual(profileFrameLayout("lord-of-dead-blue").layers.map(({ role, edge }) => [role, edge]), [["front", "top"], ["back", "top"], ["back", "bottom"]]);
  assert.deepEqual(profileFrameLayout("celestial-chart").layers.map(({ role, edge }) => [role, edge]), [["back", "top"], ["front", "top"], ["front", "bottom"]]);
  assert.deepEqual(profileFrameLayout("tropical-symphony").layers.map(({ role, edge }) => [role, edge]), [["front", "top"], ["front", "bottom"], ["back", "bottom"]]);
  assert.deepEqual(profileFrameLayout("lofi-landscape").layers.map(({ role, edge }) => [role, edge]), [["back", "top"]]);
});

