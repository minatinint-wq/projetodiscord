import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PROFILE_ART_EFFECTS, PROFILE_ART_IDS, profileArtSrc } from "../profile-art.js";

test("profile art catalog only exposes bundled animated PNGs", () => {
  assert.equal(PROFILE_ART_EFFECTS.length, 3);
  assert.equal(PROFILE_ART_IDS.size, PROFILE_ART_EFFECTS.length);
  for (const [id, , file] of PROFILE_ART_EFFECTS.slice(1)) {
    assert.equal(profileArtSrc(id), `/profile-art/${file}`);
    const bytes = fs.readFileSync(new URL(`../public/profile-art/${file}`, import.meta.url));
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert(bytes.includes(Buffer.from("acTL")), `${id} precisa ser APNG animado`);
  }
  assert.equal(profileArtSrc("none"), null);
  assert.equal(profileArtSrc("unknown"), null);
});

