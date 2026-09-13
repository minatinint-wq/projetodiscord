import assert from "node:assert/strict"
import {test} from "node:test"
import {updateVoiceActivity} from "../src/voiceActivity.js"

test("VAD ignora silêncio e reage ao sinal real com retenção curta",()=>{
 const silence=new Uint8Array(1024).fill(128)
 const speech=Uint8Array.from({length:1024},(_,index)=>128+Math.round(Math.sin(index*.19)*30))
 let state={}
 for(let index=0;index<14;index++)state=updateVoiceActivity(state,silence,index*50)
 assert.equal(state.speaking,false)
 state=updateVoiceActivity(state,speech,750)
 assert.equal(state.speaking,true)
 state=updateVoiceActivity(state,silence,850)
 assert.equal(state.speaking,true)
 for(let index=0;index<18;index++)state=updateVoiceActivity(state,silence,1200+index*50)
 assert.equal(state.speaking,false)
})
