import {test} from "node:test";import assert from "node:assert/strict";
import {GAME_CATALOG} from "../game-catalog.js";import {PROFILE_EFFECTS,AVATAR_FRAMES} from "../cosmetics.js";
test("400 jogos com IDs únicos, imagem real e fonte",()=>{
 assert.equal(GAME_CATALOG.length,400);assert.equal(new Set(GAME_CATALOG.map(game=>game.id)).size,400);
 for(const game of GAME_CATALOG){assert.match(game.iconUrl||"",/^https:\/\//,game.name);assert.match(game.iconSource||"",/^https:\/\//,game.name);}
 assert.ok(PROFILE_EFFECTS.length>=15);assert.deepEqual(AVATAR_FRAMES.slice(0,4).map(([id])=>id),["none","snowglobe","fire","glitch"]);
 assert.equal(AVATAR_FRAMES.length,639);assert.equal(new Set(AVATAR_FRAMES.map(([id])=>id)).size,639);
});
