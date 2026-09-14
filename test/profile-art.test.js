import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PROFILE_ART_EFFECTS, PROFILE_ART_IDS, profileArtSrc } from "../profile-art.js";

test("profile art catalog exposes bundled APNGs and approved HTTPS references", () => {
  assert.equal(PROFILE_ART_EFFECTS.length, 4);
  assert.equal(PROFILE_ART_IDS.size, PROFILE_ART_EFFECTS.length);
  for (const [id, , file] of PROFILE_ART_EFFECTS.slice(1)) {
    const src = profileArtSrc(id);
    if (file.startsWith("https://")) {
      const url = new URL(src);
      assert.equal(url.protocol, "https:");
      assert.equal(url.hostname, "cdn.discordapp.com");
      assert.match(url.pathname, /^\/media\/v1\/collectibles-shop\/[a-f0-9]+$/);
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

