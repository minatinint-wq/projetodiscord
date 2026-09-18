export const LOCAL_PREFERENCE_DEFAULTS = Object.freeze({
  sesh_audio_input: "",
  sesh_audio_output: "",
  sesh_video_input: "",
  sesh_input_volume: "100",
  sesh_output_volume: "80",
  sesh_input_sensitivity: "50",
  sesh_audio_profile: "isolated",
  sesh_noise_suppression: "true",
  sesh_echo_cancellation: "true",
  sesh_auto_gain: "true",
  sesh_screen_quality: "720",
  sesh_stream_preview: "true",
  sesh_sound_enabled: "true",
  sesh_sound_message: "true",
  sesh_sound_call: "true",
  sesh_desktop_notifications: "true",
  sesh_notify_reactions: "true",
  sesh_notify_friend_online: "false",
  sesh_notify_events: "true",
  sesh_notify_profile_updates: "false",
  sesh_unread_badge: "true",
  orbit_notifications: "true",
  sesh_show_media: "true",
  sesh_show_reactions: "true",
  sesh_show_send_button: "true",
  sesh_auto_emojis: "true",
  sesh_spoilers: "click",
  sesh_sensitive_media: "blur",
  sesh_spam_filter: "unknown",
  sesh_message_requests: "true",
  sesh_streamer_mode: "false",
  sesh_font_size: "16",
  sesh_interface_density: "default",
  sesh_chat_density: "default",
  sesh_message_spacing: "16",
  sesh_saturation: "100",
  sesh_high_contrast: "false",
  sesh_underline_links: "false",
  sesh_reduced_motion: "false",
  sesh_animate_gifs: "true",
  sesh_animate_emoji: "true",
  sesh_image_descriptions: "false",
  sesh_tts_rate: "1",
  sesh_time_format: "24",
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min));

export function readLocalPreference(key) {
  return localStorage.getItem(key) ?? LOCAL_PREFERENCE_DEFAULTS[key] ?? "";
}

export function writeLocalPreference(key, value) {
  localStorage.setItem(key, String(value));
  applyLocalPreferences();
  window.dispatchEvent(new CustomEvent("sesh:settings-changed", { detail: { key, value } }));
}

export function applyLocalPreferences(root = document.documentElement) {
  if (!root) return;
  const value = readLocalPreference;
  root.dataset.reducedMotion = value("sesh_reduced_motion");
  root.dataset.interfaceDensity = value("sesh_interface_density");
  root.dataset.chatDensity = value("sesh_chat_density");
  root.dataset.highContrast = value("sesh_high_contrast");
  root.dataset.underlineLinks = value("sesh_underline_links");
  root.dataset.showMedia = value("sesh_show_media");
  root.dataset.showReactions = value("sesh_show_reactions");
  root.dataset.showSendButton = value("sesh_show_send_button");
  root.dataset.streamerMode = value("sesh_streamer_mode");
  root.dataset.animateEmoji = value("sesh_animate_emoji");
  root.dataset.animateGifs = value("sesh_animate_gifs");
  root.dataset.sensitiveMedia = value("sesh_sensitive_media");
  root.dataset.spoilers = value("sesh_spoilers");
  root.style.setProperty("--sesh-chat-font-size", `${clamp(value("sesh_font_size"), 12, 24)}px`);
  root.style.setProperty("--sesh-message-spacing", `${clamp(value("sesh_message_spacing"), 4, 32)}px`);
  root.style.setProperty("--sesh-ui-saturation", `${clamp(value("sesh_saturation"), 0, 100)}%`);
}
