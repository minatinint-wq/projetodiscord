export function audioConstraints() {
  const deviceId = localStorage.getItem("sesh_audio_input");
  const studio = localStorage.getItem("sesh_audio_profile") === "studio";
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    echoCancellation: !studio,
    noiseSuppression: !studio && localStorage.getItem("sesh_noise_suppression") !== "false",
    autoGainControl: !studio && localStorage.getItem("sesh_auto_gain") !== "false",
  };
}
export function mediaError(error) {
  return ({
    NotAllowedError: "Acesso negado. Libere o microfone ou câmera nas permissões do navegador/Windows.",
    NotFoundError: "Nenhum dispositivo encontrado. Conecte um microfone e atualize a lista.",
    NotReadableError: "O dispositivo está ocupado ou indisponível. Confira outros aplicativos que o utilizam.",
    OverconstrainedError: "O dispositivo salvo não está conectado. Selecione Dispositivo padrão.",
    SecurityError: "Abra o Sesh por HTTPS ou no aplicativo desktop para usar dispositivos.",
  })[error?.name] || error?.message || "Não foi possível iniciar o dispositivo.";
}
export async function microphone() {
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error("Microfone indisponível. Use HTTPS ou o aplicativo desktop.");
  try { return await navigator.mediaDevices.getUserMedia({ audio: audioConstraints() }); }
  catch (error) {
    if (error.name !== "OverconstrainedError" && error.name !== "NotFoundError") throw error;
    localStorage.removeItem("sesh_audio_input");
    return navigator.mediaDevices.getUserMedia({ audio: audioConstraints() });
  }
}
