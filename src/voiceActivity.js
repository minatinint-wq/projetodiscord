const clamp=(value,min,max)=>Math.min(max,Math.max(min,value))

export function updateVoiceActivity(state={},samples,now=performance.now(),sensitivity=50){
 let energy=0
 for(let index=0;index<samples.length;index++){
  const sample=(samples[index]-128)/128
  energy+=sample*sample
 }
 const rms=Math.sqrt(energy/Math.max(1,samples.length))
 const smoothed=(state.smoothed??rms)*.64+rms*.36
 const calibration=Math.min(13,(state.calibration||0)+1)
 let noiseFloor=state.noiseFloor??.008
 if(calibration<=12)noiseFloor=clamp(noiseFloor*.72+rms*.28,.004,.03)
 const sensitivityScale=2**((50-clamp(Number(sensitivity)||50,0,100))/50)
 const startThreshold=Math.max(.026,noiseFloor*2.45)*sensitivityScale
 const stopThreshold=Math.max(.016,noiseFloor*1.55)*sensitivityScale
 let holdUntil=state.holdUntil||0
 if(calibration>12&&smoothed>startThreshold)holdUntil=now+260
 const speaking=calibration>12&&(smoothed>(state.speaking?stopThreshold:startThreshold)||holdUntil>now)
 if(!speaking&&calibration>12&&rms<startThreshold)noiseFloor=clamp(noiseFloor*.97+rms*.03,.004,.04)
 return {rms,smoothed,noiseFloor,calibration,holdUntil,speaking}
}
