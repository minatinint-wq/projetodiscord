import assert from "node:assert/strict"
import { test } from "node:test"
import { readFile } from "node:fs/promises"
import { AVATAR_FRAMES, PROFILE_OVERLAYS, PREMIUM_AVATAR_FRAMES, PREMIUM_PROFILE_OVERLAYS, PREMIUM_BANNER_PRESETS } from "../cosmetics.js"

const asset = (kind, id) => new URL("../public/cosmetics-optimized/" + kind + "/" + id + ".png", import.meta.url)
const animatedAsset = (kind, id) => new URL("../public/cosmetics-animated/" + kind + "/" + id + ".webp", import.meta.url)
const apngFrame = id => new URL("../public/cosmetics-animated/frames/" + id + ".png", import.meta.url)
const pngInfo = async (url) => {
  const bytes = await readFile(url)
  return { bytes, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] }
}

test("pacote premium tem molduras APNG e seis variantes de perfil", async () => {
  assert.equal(PREMIUM_AVATAR_FRAMES.length, 637)
  assert.equal(PREMIUM_PROFILE_OVERLAYS.length, 6)
  assert.equal(PREMIUM_BANNER_PRESETS.length, 6)
  for (const id of ["snowglobe", "fire", "glitch"]) {
    assert(AVATAR_FRAMES.some(([value]) => value === id), id)
    const info = await pngInfo(apngFrame(id))
    assert(info.bytes.length > 100_000, id)
    assert([3, 4, 6].includes(info.colorType), id + " precisa preservar alpha")
    if (info.colorType === 3) assert(info.bytes.includes(Buffer.from("tRNS")), id + " precisa conter transparência indexada")
    assert.equal(info.width, info.height, id)
    const animationChunk = info.bytes.indexOf(Buffer.from("acTL"))
    assert(animationChunk > 0, id + " precisa ser APNG")
    assert(info.bytes.readUInt32BE(animationChunk + 4) > 1, id + " precisa conter vários quadros")
  }
  for (const id of PREMIUM_PROFILE_OVERLAYS) {
    assert(PROFILE_OVERLAYS.some(([value]) => value === id), id)
    const info = await pngInfo(asset("overlays", id))
    assert(info.bytes.length > 100_000, id)
    assert([4, 6].includes(info.colorType), id + " precisa preservar alpha")
    assert(info.height > info.width, id)
  }
  for (const id of PREMIUM_BANNER_PRESETS) {
    const info = await pngInfo(asset("banners", id))
    assert(info.width / info.height > 2.8, id)
  }
})

test("cada cosm�tico premium possui WebP animado real", async () => {
  for (const [kind, ids] of [["overlays",PREMIUM_PROFILE_OVERLAYS],["banners",PREMIUM_BANNER_PRESETS]]) {
    for (const id of ids) {
      const bytes=await readFile(animatedAsset(kind,id))
      assert.equal(bytes.subarray(0,4).toString(),"RIFF",id)
      assert.equal(bytes.subarray(8,12).toString(),"WEBP",id)
      assert(bytes.includes(Buffer.from("ANIM")),id+" precisa conter cabe�alho animado")
      assert(bytes.includes(Buffer.from("ANMF")),id+" precisa conter quadros animados")
    }
  }
})
