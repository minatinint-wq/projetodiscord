import { expect, test } from "@playwright/test";

test("mute e deafen aparecem para as outras pessoas da call", async ({ page, browser }) => {
  await page.request.post("/api/auth/login", { data: { username: "demo", password: "demo123" } });
  const community = (await (await page.request.post("/api/servers", { data: { name: "Estado da call" } })).json()).server;
  const voiceChannel = community.channels.find((channel) => channel.type === "voice");
  const context = await browser.newContext();
  const peer = await context.newPage();
  try {
    const registered = await context.request.post("http://127.0.0.1:34170/api/auth/register", {
      data: { username: "voicepeer", email: "voicepeer@sesh.test", password: "test1234", displayName: "Amiga da call" },
    });
    expect(registered.ok()).toBeTruthy();
    await context.request.post(`http://127.0.0.1:34170/api/servers/${community.inviteCode}/join`, { data: {} });
    await page.goto("/app");
    await peer.goto("http://127.0.0.1:34170/app");
    await page.getByTitle("Estado da call", { exact: true }).click();
    await peer.getByTitle("Estado da call", { exact: true }).click();
    await page.locator(".channel-row").filter({ hasText: voiceChannel.name }).click();
    await peer.locator(".channel-row").filter({ hasText: voiceChannel.name }).click();
    await page.getByRole("button", { name: "Entrar na chamada" }).click();
    await peer.getByRole("button", { name: "Entrar na chamada" }).click();

    const ownerOnPeer = peer.locator(".voice-tile").filter({ hasText: "Usuário Demo" });
    await expect(ownerOnPeer).toBeVisible();
    await page.locator('.voice-controls button[title="Silenciar microfone"]').click();
    await expect(ownerOnPeer.getByTitle("Microfone silenciado")).toBeVisible();
    await page.locator('.voice-controls button[title="Silenciar áudio"]').click();
    await expect(ownerOnPeer.getByTitle("Áudio desativado")).toBeVisible();
    await page.locator('.voice-controls button[title="Ativar microfone"]').click();
    await expect(ownerOnPeer.getByTitle("Microfone silenciado")).toHaveCount(0);
  } finally {
    await context.close();
  }
});
