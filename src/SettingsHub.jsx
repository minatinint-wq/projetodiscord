import React, { useEffect, useRef, useState } from "react";
import { X, Search, Mic, Shield, MessageSquare, Bell, Sparkles, Radio, Volume2, Sliders, CreditCard, LogOut } from "lucide-react";
import { api } from "./api";
import { microphone, mediaError } from "./media";

const sections = [
 ["voice","Voz e vídeo",Mic],["transmission","Transmissão",Radio],["sounds","Sons",Volume2],
 ["notifications","Notificações",Bell],["messages","Mensagens",MessageSquare],
 ["privacy","Dados e privacidade",Shield],["advanced","Aparência e desempenho",Sliders],
 ["plus","Sesh Plus",Sparkles],["subscriptions","Assinatura",CreditCard],
];
function read(key, fallback) { return localStorage.getItem(key) ?? fallback; }
export default function SettingsHub({ user, onClose, onAccount, onLogout, Avatar }) {
  const [section,setSection]=useState("voice"), [query,setQuery]=useState("");
  const [devices,setDevices]=useState([]), [error,setError]=useState(""), [notice,setNotice]=useState("");
  const [testing,setTesting]=useState(false), [level,setLevel]=useState(0), [camera,setCamera]=useState(false);
  const [prefs,setPrefs]=useState(user.preferences || {}), [plan,setPlan]=useState(null);
  const [values,setValues]=useState(() => ({
    sesh_audio_input:read("sesh_audio_input",""),sesh_audio_output:read("sesh_audio_output",""),sesh_video_input:read("sesh_video_input",""),
    sesh_output_volume:read("sesh_output_volume","80"),sesh_audio_profile:read("sesh_audio_profile","isolated"),
    sesh_noise_suppression:read("sesh_noise_suppression","true"),sesh_auto_gain:read("sesh_auto_gain","true"),
    sesh_screen_quality:read("sesh_screen_quality","720"),orbit_notifications:read("orbit_notifications","true"),
    sesh_sound_enabled:read("sesh_sound_enabled","true"),sesh_reduced_motion:read("sesh_reduced_motion","false"),
  }));
  const testRef=useRef({}),cameraRef=useRef(null),videoRef=useRef(null),epoch=useRef(0);
  const [recordingUrl,setRecordingUrl]=useState("");
  const recordingRef=useRef("");
  const refresh=async()=>{ try { setDevices(await navigator.mediaDevices?.enumerateDevices() || []); } catch(e){ setError(mediaError(e)); } };
  function stopTest(update=true) {
    const t=testRef.current; testRef.current={};
    cancelAnimationFrame(t.raf); clearTimeout(t.timer);
    if(t.recorder?.state==="recording") t.recorder.stop();
    t.stream?.getTracks().forEach(track=>track.stop()); t.context?.close().catch(()=>{});
    if(update){setTesting(false);setLevel(0);}
  }
  function stopCamera(){cameraRef.current?.getTracks().forEach(t=>t.stop());cameraRef.current=null;if(videoRef.current)videoRef.current.srcObject=null;setCamera(false);}
  useEffect(()=>{
    api.me().then(result=>setPrefs(result.user.preferences||{})).catch(e=>setError(e.message));
    refresh(); navigator.mediaDevices?.addEventListener?.("devicechange",refresh);
    const key=(e)=>{if(e.key==="Escape")onClose();}; window.addEventListener("keydown",key);
    return ()=>{epoch.current++;stopTest(false);cameraRef.current?.getTracks().forEach(t=>t.stop());URL.revokeObjectURL(recordingRef.current);navigator.mediaDevices?.removeEventListener?.("devicechange",refresh);window.removeEventListener("keydown",key);};
  },[]);
  useEffect(()=>{ if(section!=="voice"){epoch.current++;stopTest();stopCamera();} },[section]);
  useEffect(()=>{if(["plus","subscriptions"].includes(section))api.mySubscription().then(setPlan).catch(e=>setError(e.message));},[section]);
  function save(key,value) {
    localStorage.setItem(key,String(value));setValues(v=>({...v,[key]:String(value)}));
    if(key==="sesh_reduced_motion")document.documentElement.dataset.reducedMotion=String(value);
    window.dispatchEvent(new Event("sesh:audio-settings"));
    setNotice("Preferência salva neste dispositivo.");
  }
  async function savePreference(key,value) {
    try {const result=await api.updateMe({preferences:{[key]:value}});setPrefs(result.user.preferences);setNotice("Preferência salva na conta.");}
    catch(e){setError(e.message);}
  }
  async function testMic() {
    if(testing){if(!testRef.current.stream)epoch.current++;stopTest();return;}
    const request=++epoch.current;setError("");setTesting(true);
    try {
      const stream=await microphone();
      if(request!==epoch.current){stream.getTracks().forEach(t=>t.stop());return;}
      const context=new AudioContext(), analyser=context.createAnalyser();
      testRef.current={stream,context};await context.resume();analyser.fftSize=1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const data=new Uint8Array(analyser.fftSize);
      const tick=()=>{if(testRef.current.context!==context)return;analyser.getByteTimeDomainData(data);
        const rms=Math.sqrt(data.reduce((n,x)=>n+((x-128)/128)**2,0)/data.length);
        setLevel(Math.min(100,Math.round(rms*450)));testRef.current.raf=requestAnimationFrame(tick);};tick();
      if(typeof MediaRecorder!=="undefined"){
        const recorder=new MediaRecorder(stream),chunks=[];testRef.current.recorder=recorder;
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
        recorder.onstop=()=>{if(!chunks.length||request!==epoch.current)return;URL.revokeObjectURL(recordingRef.current);
          recordingRef.current=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));setRecordingUrl(recordingRef.current);};
        recorder.start();
      }
      testRef.current.timer=setTimeout(()=>stopTest(),6000);refresh();
    } catch(e){stopTest();setError(mediaError(e));}
  }
  async function testCamera(){
    if(camera){stopCamera();return;}setError("");const request=epoch.current;
    try{const stream=await navigator.mediaDevices.getUserMedia({video:values.sesh_video_input?{deviceId:{exact:values.sesh_video_input}}:true});
      if(request!==epoch.current){stream.getTracks().forEach(t=>t.stop());return;}
      cameraRef.current=stream;videoRef.current.srcObject=stream;setCamera(true);refresh();
    }catch(e){setError(mediaError(e));}
  }
  async function testOutput(){
    try{const context=new AudioContext();if(values.sesh_audio_output&&context.setSinkId)await context.setSinkId(values.sesh_audio_output);
      await context.resume();const tone=context.createOscillator(),gain=context.createGain();tone.frequency.value=520;
      gain.gain.setValueAtTime(Number(values.sesh_output_volume)/100*.1,context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.3);tone.connect(gain).connect(context.destination);tone.start();tone.stop(context.currentTime+.3);tone.onended=()=>context.close();
    }catch(e){setError(mediaError(e));}
  }
  const toggle=(label,key,help)=><label className="setting-row"><span><strong>{label}</strong><small>{help}</small></span><input type="checkbox" checked={values[key]!=="false"} onChange={e=>save(key,e.target.checked)}/></label>;
  const device=(label,kind,key)=><label className="setting-field">{label}<select value={values[key]} onChange={e=>save(key,e.target.value)}><option value="">Dispositivo padrão</option>{devices.filter(d=>d.kind===kind&&d.deviceId).map((d,i)=><option key={d.deviceId} value={d.deviceId}>{d.label||label+" "+(i+1)}</option>)}</select></label>;
  return <div className="voice-settings-backdrop"><section className="settings-hub" role="dialog" aria-modal="true" aria-label="Configurações">
    <aside className="settings-hub-nav"><div className="settings-person"><Avatar user={user} small/><div><strong>{user.displayName}</strong><small>@{user.username}</small></div></div>
      <label className="settings-search"><Search size={16}/><input placeholder="Buscar configuração" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <button onClick={onAccount}>Editar perfil e conta</button><small className="eyebrow">PREFERÊNCIAS</small>
      {sections.filter(([,title])=>title.toLowerCase().includes(query.toLowerCase())).map(([id,title,Icon])=><button key={id} className={section===id?"active":""} onClick={()=>{setSection(id);setError("");setNotice("");}}><Icon size={17}/>{title}</button>)}
      <button className="settings-logout" onClick={()=>onLogout?.()}><LogOut size={16}/>Sair da conta</button>
    </aside><main className="settings-hub-main"><header><span className="eyebrow">SEU SESH, DO SEU JEITO</span><h1>{sections.find(s=>s[0]===section)?.[1]}</h1><button className="settings-close" aria-label="Fechar configurações" onClick={onClose}><X/></button></header>
      {error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="settings-success" role="status">{notice}</p>}
      {section==="voice"&&<><p className="settings-lead">Confira seus dispositivos antes de entrar na conversa.</p><div className="settings-card"><h2>Entrada e saída</h2><div className="voice-device-grid">{device("Microfone","audioinput","sesh_audio_input")}{device("Alto-falante","audiooutput","sesh_audio_output")}</div>
        <button className="secondary-setting" onClick={refresh}>Atualizar dispositivos</button>
        <div className="mic-test-box"><div><strong>Vamos testar sua voz</strong><p>Fale por 6 segundos. O medidor mostra o áudio capturado; depois você pode ouvir a gravação.</p></div><button className="prompt-confirm" onClick={testMic}>{testing?"Parar teste":"Testar microfone"}</button>
        <div className="real-mic-meter" role="meter" aria-label="Nível do microfone" aria-valuenow={level} aria-valuemin={0} aria-valuemax={100}><span style={{width:level+"%"}}/></div><small>{testing?"Capturando áudio • "+level+"%":"O teste usa apenas este dispositivo."}</small>
        {recordingUrl&&<audio controls src={recordingUrl} ref={el=>{if(el){el.volume=Number(values.sesh_output_volume)/100;if(el.setSinkId&&values.sesh_audio_output)el.setSinkId(values.sesh_audio_output).catch(()=>{});}}}/>}</div>
        <label className="setting-field">Volume de saída · {values.sesh_output_volume}%<input type="range" min="0" max="100" value={values.sesh_output_volume} onChange={e=>save("sesh_output_volume",e.target.value)}/></label><button className="secondary-setting" onClick={testOutput}>Ouvir som de teste</button></div>
        <div className="settings-card"><h2>Processamento de voz</h2><label className="setting-field">Perfil<select value={values.sesh_audio_profile} onChange={e=>save("sesh_audio_profile",e.target.value)}><option value="isolated">Conversa · cancelamento de eco</option><option value="studio">Estúdio · áudio sem processamento</option></select></label>
        {toggle("Supressão de ruído","sesh_noise_suppression","Reduz ruídos de fundo no perfil Conversa.")}
        {toggle("Ganho automático","sesh_auto_gain","Equilibra o nível da voz no perfil Conversa.")}
        <p className="settings-hint">Mudanças de entrada e processamento são aplicadas ao entrar novamente na chamada.</p></div>
        <div className="settings-card"><h2>Câmera</h2>{device("Câmera","videoinput","sesh_video_input")}<video ref={videoRef} autoPlay muted playsInline className={"settings-camera "+(camera?"on":"")}/><button className="secondary-setting" onClick={testCamera}>{camera?"Encerrar prévia":"Testar câmera"}</button></div></>}
      {section==="transmission"&&<div className="settings-card"><h2>Compartilhamento de tela</h2><p>Você escolhe a tela ou janela em cada transmissão. A captura só começa após essa escolha.</p><label className="setting-field">Qualidade desejada<select value={values.sesh_screen_quality} onChange={e=>save("sesh_screen_quality",e.target.value)}><option value="720">720p · menor consumo</option><option value="1080">1080p · mais detalhes</option></select></label><p className="settings-hint">Até 30 FPS, conforme conexão e dispositivo. Áudio do sistema ainda não é transmitido.</p></div>}
      {section==="sounds"&&<div className="settings-card"><h2>Sons da conversa</h2>{toggle("Sons de interface","sesh_sound_enabled","Tocar alertas ao conectar, desconectar e receber menções.")}<button className="prompt-confirm" onClick={testOutput}>Testar saída de áudio</button></div>}
      {section==="notifications"&&<div className="settings-card"><h2>Menções e mensagens</h2>{toggle("Alertas de menções","orbit_notifications","Ativa o aviso sonoro quando mencionarem você.")}<p>As mensagens continuam chegando mesmo com os sons desativados.</p></div>}
      {section==="messages"&&<div className="settings-card"><h2>Quem pode conversar com você</h2><p>As mensagens diretas ficam disponíveis entre amizades aceitas.</p><label className="setting-row"><span><strong>Receber mensagens diretas de amigos</strong><small>Salvo na conta e validado pelo servidor.</small></span><input type="checkbox" checked={prefs.allowDirectMessages!==false} onChange={e=>savePreference("allowDirectMessages",e.target.checked)}/></label></div>}
      {section==="privacy"&&<div className="settings-card"><h2>Seus dados</h2><p>O Sesh armazena seu perfil, amizades e mensagens para sincronizar a experiência. Testes de microfone e câmera nesta tela ficam no dispositivo.</p><a href="/legal.html" target="_blank" rel="noreferrer">Ler termos e política de privacidade</a><button className="secondary-setting" onClick={async()=>{try{const {user:profile}=await api.me();const blob=new Blob([JSON.stringify(profile,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="meu-perfil-sesh.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(e.message);}}}>Baixar meus dados de perfil</button><p className="settings-hint">A exportação contém os dados do perfil; não inclui o histórico de mensagens.</p></div>}
      {section==="advanced"&&<div className="settings-card"><h2>Movimento e desempenho</h2><label className="setting-row"><span><strong>Reduzir animações</strong><small>Desativa movimentos decorativos de nomes e perfis.</small></span><input type="checkbox" checked={values.sesh_reduced_motion==="true"} onChange={e=>save("sesh_reduced_motion",e.target.checked)}/></label><p>O aplicativo também respeita a preferência de movimento reduzido do sistema.</p></div>}
      {["plus","subscriptions"].includes(section)&&<div className="settings-card plus-card"><Sparkles size={32}/><h2>{section==="plus"?"Mais personalidade para cada conversa":"Sua assinatura"}</h2><p>Explore molduras, efeitos animados e estilos de nome no editor de perfil.</p><button className="prompt-confirm" onClick={onAccount}>Personalizar meu perfil</button><h3>Estado da conta</h3><p>{plan ? (plan.subscription?.status==="active"?"Assinatura ativa: "+plan.subscription.planId:"Sem assinatura ativa.") : "Consultando assinatura…"}</p><small>Compras e pagamentos online ainda não estão disponíveis.</small></div>}
    </main></section></div>;
}
