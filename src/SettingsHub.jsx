import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility, Bell, CreditCard, Eye, ImagePlus, Keyboard, Languages,
  LogOut, MessageSquare, Mic, Monitor, Palette, Radio, Search, Shield,
  Sparkles, Trash2, Volume2, X,
} from "lucide-react";
import { api } from "./api";
import { microphone, mediaError } from "./media";
import { readAttachment } from "./files";
import {
  LOCAL_PREFERENCE_DEFAULTS,
  applyLocalPreferences,
  readLocalPreference,
  writeLocalPreference,
} from "./localPreferences";

const sections = [
  { group: "ÁUDIO E VÍDEO", id: "voice", title: "Voz e vídeo", icon: Mic },
  { group: "ÁUDIO E VÍDEO", id: "transmission", title: "Transmissão", icon: Radio },
  { group: "ÁUDIO E VÍDEO", id: "sounds", title: "Sons", icon: Volume2 },
  { group: "PREFERÊNCIAS", id: "notifications", title: "Notificações", icon: Bell },
  { group: "PREFERÊNCIAS", id: "messages", title: "Mensagens e conteúdo", icon: MessageSquare },
  { group: "PREFERÊNCIAS", id: "privacy", title: "Dados e privacidade", icon: Shield },
  { group: "EXPERIÊNCIA", id: "appearance", title: "Aparência", icon: Palette },
  { group: "EXPERIÊNCIA", id: "accessibility", title: "Acessibilidade", icon: Accessibility },
  { group: "EXPERIÊNCIA", id: "system", title: "Sistema e atalhos", icon: Monitor },
  { group: "SESH", id: "plus", title: "Sesh Plus", icon: Sparkles },
  { group: "SESH", id: "subscriptions", title: "Assinatura", icon: CreditCard },
];

const localKeys = Object.keys(LOCAL_PREFERENCE_DEFAULTS);
const booleanValue = (value) => String(value) !== "false";

export default function SettingsHub({ user, onClose, onAccount, onLogout, onUserUpdate, Avatar }) {
  const [section, setSection] = useState("voice");
  const [query, setQuery] = useState("");
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [testing, setTesting] = useState(false);
  const [level, setLevel] = useState(0);
  const [camera, setCamera] = useState(false);
  const [prefs, setPrefs] = useState(user.preferences || {});
  const [plan, setPlan] = useState(null);
  const [values, setValues] = useState(() => Object.fromEntries(localKeys.map((key) => [key, readLocalPreference(key)])));
  const testRef = useRef({});
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const epoch = useRef(0);
  const backgroundInput = useRef(null);
  const recordingRef = useRef("");
  const [recordingUrl, setRecordingUrl] = useState("");

  const visibleSections = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return term ? sections.filter((item) => `${item.group} ${item.title}`.toLocaleLowerCase("pt-BR").includes(term)) : sections;
  }, [query]);

  const refresh = async () => {
    try { setDevices(await navigator.mediaDevices?.enumerateDevices() || []); }
    catch (cause) { setError(mediaError(cause)); }
  };

  function stopTest(update = true) {
    const active = testRef.current;
    testRef.current = {};
    cancelAnimationFrame(active.raf);
    clearTimeout(active.timer);
    if (active.recorder?.state === "recording") active.recorder.stop();
    active.stream?.getTracks().forEach((track) => track.stop());
    active.context?.close().catch(() => {});
    if (update) { setTesting(false); setLevel(0); }
  }

  function stopCamera() {
    cameraRef.current?.getTracks().forEach((track) => track.stop());
    cameraRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamera(false);
  }

  useEffect(() => {
    applyLocalPreferences();
    api.me().then((result) => setPrefs(result.user.preferences || {})).catch((cause) => setError(cause.message));
    refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    const close = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => {
      epoch.current += 1;
      stopTest(false);
      cameraRef.current?.getTracks().forEach((track) => track.stop());
      URL.revokeObjectURL(recordingRef.current);
      navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
      window.removeEventListener("keydown", close);
    };
  }, []);

  useEffect(() => {
    if (section !== "voice") { epoch.current += 1; stopTest(); stopCamera(); }
  }, [section]);

  useEffect(() => {
    if (["plus", "subscriptions"].includes(section))
      api.mySubscription().then(setPlan).catch((cause) => setError(cause.message));
  }, [section]);

  function save(key, value) {
    writeLocalPreference(key, value);
    setValues((current) => ({ ...current, [key]: String(value) }));
    window.dispatchEvent(new Event("sesh:audio-settings"));
    if (key === "sesh_desktop_notifications" && booleanValue(value) && "Notification" in window && Notification.permission === "default")
      Notification.requestPermission().catch(() => {});
    setNotice("Preferência aplicada neste dispositivo.");
  }

  async function savePreference(key, value) {
    try {
      setError("");
      const result = await api.updateMe({ preferences: { [key]: value } });
      setPrefs(result.user.preferences || {});
      onUserUpdate?.(result.user);
      setNotice("Preferência sincronizada na sua conta.");
    } catch (cause) { setError(cause.message); }
  }

  async function chooseBackground(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setError("");
      setNotice("Preparando imagem de fundo…");
      const value = await readAttachment(file);
      if (typeof value !== "string") throw new Error("Escolha uma imagem PNG, JPEG, WebP ou GIF.");
      await savePreference("appBackground", value);
    } catch (cause) { setNotice(""); setError(cause.message); }
  }

  async function testMic() {
    if (testing) { if (!testRef.current.stream) epoch.current += 1; stopTest(); return; }
    const request = ++epoch.current;
    setError("");
    setTesting(true);
    try {
      const stream = await microphone();
      if (request !== epoch.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      testRef.current = { stream, context };
      await context.resume();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (testRef.current.context !== context) return;
        analyser.getByteTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((total, sample) => total + ((sample - 128) / 128) ** 2, 0) / data.length);
        setLevel(Math.min(100, Math.round(rms * 450)));
        testRef.current.raf = requestAnimationFrame(tick);
      };
      tick();
      if (typeof MediaRecorder !== "undefined") {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        testRef.current.recorder = recorder;
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onstop = () => {
          if (!chunks.length || request !== epoch.current) return;
          URL.revokeObjectURL(recordingRef.current);
          recordingRef.current = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
          setRecordingUrl(recordingRef.current);
        };
        recorder.start();
      }
      testRef.current.timer = setTimeout(() => stopTest(), 6000);
      refresh();
    } catch (cause) { stopTest(); setError(mediaError(cause)); }
  }

  async function testCamera() {
    if (camera) { stopCamera(); return; }
    setError("");
    const request = epoch.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: values.sesh_video_input ? { deviceId: { exact: values.sesh_video_input } } : true });
      if (request !== epoch.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      cameraRef.current = stream;
      videoRef.current.srcObject = stream;
      setCamera(true);
      refresh();
    } catch (cause) { setError(mediaError(cause)); }
  }

  async function testOutput(kind = "message") {
    try {
      const context = new AudioContext();
      if (values.sesh_audio_output && context.setSinkId) await context.setSinkId(values.sesh_audio_output);
      await context.resume();
      const tone = context.createOscillator();
      const gain = context.createGain();
      tone.frequency.value = kind === "call" ? 660 : 520;
      gain.gain.setValueAtTime(Number(values.sesh_output_volume) / 100 * .1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .3);
      tone.connect(gain).connect(context.destination);
      tone.start();
      tone.stop(context.currentTime + .3);
      tone.onended = () => context.close();
    } catch (cause) { setError(mediaError(cause)); }
  }

  async function exportProfile() {
    try {
      const { user: profile } = await api.me();
      const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "meu-perfil-sesh.json";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setError(cause.message); }
  }

  function resetDevicePreferences() {
    if (!window.confirm("Restaurar as configurações deste dispositivo?")) return;
    localKeys.forEach((key) => localStorage.removeItem(key));
    setValues(Object.fromEntries(localKeys.map((key) => [key, readLocalPreference(key)])));
    applyLocalPreferences();
    window.dispatchEvent(new Event("sesh:settings-changed"));
    setNotice("Configurações deste dispositivo restauradas.");
  }

  const toggle = (label, key, help) => <label className="setting-row"><span><strong>{label}</strong><small>{help}</small></span><input type="checkbox" checked={booleanValue(values[key])} onChange={(event) => save(key, event.target.checked)} /></label>;
  const accountToggle = (label, key, help, fallback = true) => <label className="setting-row"><span><strong>{label}</strong><small>{help}</small></span><input type="checkbox" checked={prefs[key] ?? fallback} onChange={(event) => savePreference(key, event.target.checked)} /></label>;
  const device = (label, kind, key) => <label className="setting-field">{label}<select value={values[key]} onChange={(event) => save(key, event.target.value)}><option value="">Dispositivo padrão</option>{devices.filter((item) => item.kind === kind && item.deviceId).map((item, index) => <option key={item.deviceId} value={item.deviceId}>{item.label || `${label} ${index + 1}`}</option>)}</select></label>;

  let lastGroup = "";
  return <div className="voice-settings-backdrop"><section className="settings-hub" role="dialog" aria-modal="true" aria-label="Configurações">
    <aside className="settings-hub-nav">
      <button className="settings-person" type="button" onClick={onAccount}><Avatar user={user} small /><span><strong>{user.displayName}</strong><small>@{user.username}</small></span></button>
      <label className="settings-search"><Search size={16} /><input placeholder="Buscar configuração" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <button onClick={onAccount}>Editar perfil e conta</button>
      <nav aria-label="Categorias de configuração">{visibleSections.map((item) => { const GroupLabel = item.group !== lastGroup ? <small className="eyebrow" key={`${item.group}-label`}>{item.group}</small> : null; lastGroup = item.group; const Icon = item.icon; return <React.Fragment key={item.id}>{GroupLabel}<button className={section === item.id ? "active" : ""} onClick={() => { setSection(item.id); setError(""); setNotice(""); }}><Icon size={17} />{item.title}</button></React.Fragment>; })}</nav>
      <button className="settings-logout" onClick={() => onLogout?.()}><LogOut size={16} />Sair da conta</button>
    </aside>
    <main className="settings-hub-main"><header><span className="eyebrow">SEU SESH, DO SEU JEITO</span><h1>{sections.find((item) => item.id === section)?.title}</h1><button className="settings-close" aria-label="Fechar configurações" onClick={onClose}><X /></button></header>
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="settings-success" role="status">{notice}</p>}

      {section === "voice" && <><p className="settings-lead">Escolha os dispositivos e ajuste exatamente o que o Sesh transmite.</p><div className="settings-card"><h2>Entrada e saída</h2><div className="voice-device-grid">{device("Microfone", "audioinput", "sesh_audio_input")}{device("Alto-falante", "audiooutput", "sesh_audio_output")}</div><button className="secondary-setting" onClick={refresh}>Atualizar dispositivos</button><label className="setting-field">Volume do microfone · {values.sesh_input_volume}%<input type="range" min="0" max="100" value={values.sesh_input_volume} onChange={(event) => save("sesh_input_volume", event.target.value)} /></label><label className="setting-field">Volume de saída · {values.sesh_output_volume}%<input type="range" min="0" max="100" value={values.sesh_output_volume} onChange={(event) => save("sesh_output_volume", event.target.value)} /></label><div className="mic-test-box"><div><strong>Teste do microfone</strong><p>Fale por 6 segundos. Você verá o nível e poderá ouvir a gravação.</p></div><button className="prompt-confirm" onClick={testMic}>{testing ? "Parar teste" : "Testar microfone"}</button><div className="real-mic-meter" role="meter" aria-label="Nível do microfone" aria-valuenow={level} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${level}%` }} /></div><small>{testing ? `Capturando áudio • ${level}%` : "O áudio do teste não sai deste dispositivo."}</small>{recordingUrl && <audio controls src={recordingUrl} ref={(element) => { if (element) { element.volume = Number(values.sesh_output_volume) / 100; if (element.setSinkId && values.sesh_audio_output) element.setSinkId(values.sesh_audio_output).catch(() => {}); } }} />}</div><button className="secondary-setting" onClick={() => testOutput()}>Ouvir som de teste</button></div><div className="settings-card"><h2>Processamento de voz</h2><label className="setting-field">Perfil<select value={values.sesh_audio_profile} onChange={(event) => save("sesh_audio_profile", event.target.value)}><option value="isolated">Isolamento de voz</option><option value="studio">Estúdio · sem processamento</option></select></label><label className="setting-field">Sensibilidade de entrada · {values.sesh_input_sensitivity}%<input type="range" min="0" max="100" value={values.sesh_input_sensitivity} onChange={(event) => save("sesh_input_sensitivity", event.target.value)} /></label>{toggle("Supressão de ruído", "sesh_noise_suppression", "Reduz ruído contínuo de fundo.")}{toggle("Cancelamento de eco", "sesh_echo_cancellation", "Evita que o som dos alto-falantes volte ao microfone.")}{toggle("Controle automático do microfone", "sesh_auto_gain", "Equilibra vozes muito baixas ou muito altas.")}<p className="settings-hint">Entrada e processamento novos são aplicados ao entrar novamente na chamada.</p></div><div className="settings-card"><h2>Câmera</h2>{device("Câmera", "videoinput", "sesh_video_input")}<video ref={videoRef} autoPlay muted playsInline className={`settings-camera ${camera ? "on" : ""}`} /><button className="secondary-setting" onClick={testCamera}>{camera ? "Encerrar prévia" : "Testar câmera"}</button></div></>}
      {section === "transmission" && <div className="settings-card"><h2>Compartilhamento de tela</h2><p>A captura só começa depois que você escolhe uma tela ou janela.</p><label className="setting-field">Qualidade<select value={values.sesh_screen_quality} onChange={(event) => save("sesh_screen_quality", event.target.value)}><option value="480">480p · conexão limitada</option><option value="720">720p · equilibrado</option><option value="1080">1080p · mais detalhes</option></select></label>{toggle("Mostrar prévias da transmissão", "sesh_stream_preview", "Permite que outras pessoas vejam uma prévia antes de entrar.")}<p className="settings-hint">Até 30 FPS, conforme conexão e dispositivo.</p></div>}
      {section === "sounds" && <div className="settings-card"><h2>Sons da conversa</h2>{toggle("Sons de interface", "sesh_sound_enabled", "Controle geral dos efeitos sonoros do Sesh.")}{toggle("Nova mensagem e menção", "sesh_sound_message", "Toca quando uma mensagem importante chega.")}{toggle("Chamada recebida", "sesh_sound_call", "Toca enquanto uma chamada aguarda resposta.")}<div className="settings-inline-actions"><button className="secondary-setting" onClick={() => testOutput("message")}>Testar mensagem</button><button className="secondary-setting" onClick={() => testOutput("call")}>Testar chamada</button></div></div>}
      {section === "notifications" && <><div className="settings-card"><h2>Visão geral</h2>{toggle("Notificações na área de trabalho", "sesh_desktop_notifications", "Exibe avisos do sistema quando o Sesh estiver em segundo plano.")}{toggle("Alertas de menções", "orbit_notifications", "Avisa quando mencionarem você.")}{toggle("Reações às minhas mensagens", "sesh_notify_reactions", "Avisa quando alguém reage ao que você enviou.")}{toggle("Amigos ficam online", "sesh_notify_friend_online", "Avisa quando uma amizade entra no Sesh.")}{toggle("Eventos do servidor", "sesh_notify_events", "Lembra sobre eventos futuros.")}{toggle("Atualizações de perfil", "sesh_notify_profile_updates", "Avisa quando amigos mudam o perfil.")}</div><div className="settings-card"><h2>Indicadores</h2>{toggle("Indicador de mensagens não lidas", "sesh_unread_badge", "Mostra o contador no ícone do aplicativo.")}<p className="settings-hint">Servidores e canais silenciados continuam respeitando suas próprias regras.</p></div></>}
      {section === "messages" && <><div className="settings-card"><h2>Filtros de conteúdo</h2><label className="setting-field">Mídia sensível<select value={values.sesh_sensitive_media} onChange={(event) => save("sesh_sensitive_media", event.target.value)}><option value="show">Mostrar</option><option value="blur">Borrar até clicar</option><option value="block">Bloquear</option></select></label><label className="setting-field">Mensagens suspeitas de spam<select value={values.sesh_spam_filter} onChange={(event) => save("sesh_spam_filter", event.target.value)}><option value="all">Filtrar todas</option><option value="unknown">Filtrar desconhecidos</option><option value="off">Não filtrar</option></select></label>{toggle("Solicitações de mensagens", "sesh_message_requests", "Separa mensagens de pessoas que você talvez não conheça.")}</div><div className="settings-card"><h2>Exibição das mensagens</h2>{toggle("Mostrar imagens e vídeos", "sesh_show_media", "Exibe anexos diretamente na conversa.")}{toggle("Mostrar reações", "sesh_show_reactions", "Exibe a faixa de reações abaixo das mensagens.")}{toggle("Mostrar botão de enviar", "sesh_show_send_button", "Mantém o botão visível ao lado da caixa de texto.")}{toggle("Converter emoticons em emoji", "sesh_auto_emojis", "Converte combinações como :) em emojis.")}<label className="setting-field">Mostrar spoilers<select value={values.sesh_spoilers} onChange={(event) => save("sesh_spoilers", event.target.value)}><option value="click">Ao clicar</option><option value="always">Sempre</option><option value="never">Nunca</option></select></label></div><div className="settings-card"><h2>Permissões de contato</h2>{accountToggle("Receber mensagens diretas de amigos", "allowDirectMessages", "O servidor bloqueia novos envios quando esta opção está desligada.")}{accountToggle("Receber pedidos de amizade", "allowFriendRequests", "O servidor recusa novos pedidos quando esta opção está desligada.")}</div></>}
      {section === "privacy" && <><div className="settings-card"><h2>Como o Sesh usa seus dados</h2><p>Mensagens, servidores e amizades são processados para o serviço funcionar. Testes de microfone e câmera permanecem no dispositivo.</p>{accountToggle("Usar dados para melhorar o Sesh", "improveSesh", "Permite métricas agregadas de estabilidade e uso.", false)}{accountToggle("Personalizar minha experiência", "personalizedExperience", "Adapta recomendações e atalhos ao seu uso.", false)}{accountToggle("Compartilhar atualizações de perfil", "shareProfileUpdates", "Permite avisar amizades quando você atualizar o perfil.", false)}</div><div className="settings-card"><h2>Seus dados</h2><a href="/legal.html" target="_blank" rel="noreferrer">Termos e política de privacidade</a><button className="secondary-setting" onClick={exportProfile}>Baixar meus dados de perfil</button><p className="settings-hint">A exportação contém sua conta e preferências; o histórico de mensagens continua protegido no servidor.</p></div></>}
      {section === "appearance" && <><div className="settings-card"><h2><Palette size={19} /> Tema</h2><p>Os temas e cores ficam sincronizados na sua conta.</p><div className="appearance-theme-grid">{[["dark", "Escuro"], ["midnight", "Ônix"], ["light", "Claro"]].map(([id, label]) => <button key={id} type="button" aria-pressed={(prefs.appTheme || "dark") === id} onClick={() => savePreference("appTheme", id)}><i className={`appearance-theme-swatch theme-${id}`} /><span>{label}</span></button>)}</div><div className="appearance-color-grid"><label className="setting-field">Cor da interface<input aria-label="Cor da interface" type="color" value={prefs.appSurfaceColor || ((prefs.appTheme || "dark") === "light" ? "#eef1f7" : "#111214")} onChange={(event) => savePreference("appSurfaceColor", event.target.value)} /></label><label className="setting-field">Cor de destaque<input aria-label="Cor de destaque da interface" type="color" value={prefs.appAccentColor || "#8b5cf6"} onChange={(event) => savePreference("appAccentColor", event.target.value)} /></label></div><button className="secondary-setting" onClick={async () => { await savePreference("appSurfaceColor", null); await savePreference("appAccentColor", null); }}>Restaurar cores do tema</button></div><div className="settings-card"><h2><ImagePlus size={19} /> Imagem de fundo</h2><p>Use uma imagem de até 3 MB. Os painéis ficam translúcidos.</p><input ref={backgroundInput} type="file" hidden accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif" onChange={chooseBackground} />{prefs.appBackground ? <div className="settings-wallpaper-preview" style={{ backgroundImage: `linear-gradient(#1116,#1116),url(${JSON.stringify(prefs.appBackground)})` }}><span>Fundo atual</span></div> : <div className="settings-wallpaper-empty">Nenhuma imagem de fundo</div>}<div className="settings-wallpaper-actions"><button className="secondary-setting" onClick={() => backgroundInput.current?.click()}><ImagePlus size={17} />{prefs.appBackground ? "Trocar imagem" : "Escolher imagem"}</button>{prefs.appBackground && <button className="secondary-setting danger" onClick={() => savePreference("appBackground", null)}><Trash2 size={17} />Remover fundo</button>}</div><label className="setting-field">Intensidade<select value={String(prefs.appBackgroundStrength || 55)} onChange={(event) => savePreference("appBackgroundStrength", Number(event.target.value))}><option value="30">Suave</option><option value="55">Equilibrada</option><option value="75">Forte</option><option value="95">Quase sem filtro</option></select></label></div><div className="settings-card"><h2><Eye size={19} /> Modo streamer</h2>{toggle("Ativar modo streamer", "sesh_streamer_mode", "Oculta detalhes pessoais da interface durante transmissões.")}<p className="settings-hint">Quando ativo, o Sesh mascara identificadores, convites e notificações na tela.</p></div></>}
      {section === "accessibility" && <><div className="settings-card settings-preview-card"><h2>Prévia</h2><div className="settings-message-preview"><Avatar user={user} small /><div><strong>{user.displayName} <small>agora</small></strong><p>Assim suas mensagens aparecem no Sesh ✨</p></div></div></div><div className="settings-card"><h2>Legibilidade</h2><label className="setting-field">Tamanho do texto · {values.sesh_font_size}px<input type="range" min="12" max="24" value={values.sesh_font_size} onChange={(event) => save("sesh_font_size", event.target.value)} /></label>{toggle("Sempre sublinhar links", "sesh_underline_links", "Ajuda links a se destacarem do texto.")}<label className="setting-field">Saturação · {values.sesh_saturation}%<input type="range" min="0" max="100" value={values.sesh_saturation} onChange={(event) => save("sesh_saturation", event.target.value)} /></label>{toggle("Alto contraste", "sesh_high_contrast", "Reforça bordas, textos e controles.")}</div><div className="settings-card"><h2>Densidade visual</h2><label className="setting-field">Interface<select value={values.sesh_interface_density} onChange={(event) => save("sesh_interface_density", event.target.value)}><option value="compact">Compacta</option><option value="default">Padrão</option><option value="spacious">Espaçosa</option></select></label><label className="setting-field">Mensagens<select value={values.sesh_chat_density} onChange={(event) => save("sesh_chat_density", event.target.value)}><option value="default">Padrão · com avatares</option><option value="compact">Compacta</option></select></label><label className="setting-field">Espaço entre mensagens · {values.sesh_message_spacing}px<input type="range" min="4" max="32" value={values.sesh_message_spacing} onChange={(event) => save("sesh_message_spacing", event.target.value)} /></label></div><div className="settings-card"><h2>Movimento</h2>{toggle("Reduzir animações", "sesh_reduced_motion", "Reduz movimentos decorativos e transições.")}{toggle("Reproduzir GIFs", "sesh_animate_gifs", "Permite animações de imagens quando o app está em primeiro plano.")}{toggle("Reproduzir emojis animados", "sesh_animate_emoji", "Permite animação em emojis e cosméticos.")}</div><div className="settings-card"><h2>Áudio e leitor de tela</h2><label className="setting-field">Velocidade do texto para voz · {values.sesh_tts_rate}x<input type="range" min="0.5" max="2" step="0.1" value={values.sesh_tts_rate} onChange={(event) => save("sesh_tts_rate", event.target.value)} /></label>{toggle("Mostrar descrições de imagens", "sesh_image_descriptions", "Exibe textos alternativos quando disponíveis.")}</div></>}
      {section === "system" && <><div className="settings-card"><h2><Languages size={19} /> Idioma e horário</h2><label className="setting-field">Idioma<select value="pt-BR" disabled><option value="pt-BR">Português do Brasil</option></select></label><label className="setting-field">Formato de hora<select value={values.sesh_time_format} onChange={(event) => save("sesh_time_format", event.target.value)}><option value="24">24 horas</option><option value="12">12 horas</option></select></label></div><div className="settings-card"><h2><Keyboard size={19} /> Atalhos principais</h2><div className="settings-shortcuts"><span>Buscar</span><kbd>Ctrl</kbd><kbd>F</kbd><span>Focar mensagem</span><kbd>Esc</kbd><span>Enviar arquivo</span><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>U</kbd><span>Microfone</span><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>M</kbd><span>Áudio</span><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>D</kbd></div></div><div className="settings-card"><h2><Monitor size={19} /> Aplicativo</h2><p><strong>Canal estável</strong><br /><span className="settings-hint">O desktop procura atualizações ao abrir e a cada 6 horas.</span></p><button className="secondary-setting danger" onClick={resetDevicePreferences}>Restaurar configurações deste dispositivo</button></div></>}
      {["plus", "subscriptions"].includes(section) && <div className="settings-card plus-card"><Sparkles size={32} /><h2>{section === "plus" ? "Mais personalidade para cada conversa" : "Sua assinatura"}</h2><p>Explore molduras, efeitos animados e estilos de nome no editor de perfil.</p><button className="prompt-confirm" onClick={onAccount}>Personalizar meu perfil</button><h3>Estado da conta</h3><p>{plan ? (plan.subscription?.status === "active" ? `Assinatura ativa: ${plan.subscription.planId}` : "Sem assinatura ativa.") : "Consultando assinatura…"}</p><small>Compras e pagamentos online ainda não estão disponíveis.</small></div>}
    </main>
  </section></div>;
}
