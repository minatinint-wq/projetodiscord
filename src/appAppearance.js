const THEME_BASE = {
  dark: "#111214",
  midnight: "#050505",
  light: "#eef1f7",
};

const clampByte = (value) => Math.max(0, Math.min(255, Math.round(value)));
const hexToRgb = (hex) => {
  const value = /^#[0-9a-f]{6}$/i.test(String(hex || "")) ? hex.slice(1) : "111214";
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
};
const rgbToHex = (rgb) => `#${rgb.map((value) => clampByte(value).toString(16).padStart(2, "0")).join("")}`;
const mix = (hex, target, amount) => {
  const source = hexToRgb(hex), destination = hexToRgb(target);
  return rgbToHex(source.map((value, index) => value + (destination[index] - value) * amount));
};
const withAlpha = (hex, alpha) => {
  const [red, green, blue] = hexToRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
};

export function appAppearance(preferences = {}, fallbackTheme = "dark") {
  const theme = ["dark", "midnight", "light"].includes(preferences.appTheme)
    ? preferences.appTheme
    : fallbackTheme;
  const surface = /^#[0-9a-f]{6}$/i.test(preferences.appSurfaceColor || "")
    ? preferences.appSurfaceColor
    : THEME_BASE[theme] || THEME_BASE.dark;
  const accent = /^#[0-9a-f]{6}$/i.test(preferences.appAccentColor || "")
    ? preferences.appAccentColor
    : "#8b5cf6";
  const accentLight = hexToRgb(accent).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0) > 150;
  const light = hexToRgb(surface).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0) > 160;
  const background = typeof preferences.appBackground === "string" ? preferences.appBackground : "";
  const strength = Math.max(10, Math.min(100, Number(preferences.appBackgroundStrength) || 55));
  const toward = light ? "#ffffff" : "#000000";
  return {
    theme,
    hasBackground: Boolean(background),
    style: {
      "--app-bg": mix(surface, toward, light ? 0.02 : 0.28),
      "--surface-1": mix(surface, toward, light ? 0.05 : 0.1),
      "--surface-2": mix(surface, toward, light ? 0.09 : 0.18),
      "--surface-3": mix(surface, toward, light ? 0.13 : 0.24),
      "--surface-4": mix(surface, light ? "#ffffff" : "#303442", light ? 0.52 : 0.24),
      "--border": mix(surface, light ? "#64708a" : "#ffffff", light ? 0.24 : 0.12),
      "--selected": mix(surface, accent, light ? 0.16 : 0.3),
      "--input-bg": mix(surface, toward, light ? 0.01 : 0.32),
      "--text": light ? "#202838" : "#f2f3f5",
      "--text-muted": light ? "#5b687d" : "#aeb4bf",
      "--text-soft": light ? "#637086" : "#8d93a1",
      "--accent": accent,
      "--accent-text": accentLight ? "#101218" : "#ffffff",
      "--app-wallpaper": background ? `url(${JSON.stringify(background)})` : "none",
      "--app-wallpaper-tint": withAlpha(surface, 1 - strength / 130),
    },
  };
}
