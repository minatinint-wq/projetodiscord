const userAgent = navigator.userAgent;
const platform = /Android/i.test(userAgent)
  ? "android"
  : /iPhone|iPad|iPod/i.test(userAgent)
    ? "ios"
    : /Windows/i.test(userAgent)
      ? "windows"
      : "web";

document.querySelector(`[data-platform="${platform}"]`)?.classList.add("active");

let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  document.querySelectorAll(".pwa-install").forEach((button) => { button.hidden = false; });
});

document.querySelectorAll(".pwa-install").forEach((button) => button.addEventListener("click", async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  document.querySelector("#status").textContent = choice.outcome === "accepted"
    ? "Instalação iniciada."
    : "Você pode instalar quando quiser.";
  installPrompt = null;
}));

window.addEventListener("appinstalled", () => {
  document.querySelector("#status").textContent = "Sesh instalado com sucesso.";
});

if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
